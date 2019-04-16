/**
 * 3D Foundation Project
 * Copyright 2018 Smithsonian Institution
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import Component, { IComponentEvent, Node, types } from "@ff/graph/Component";

import { IReader, EReaderPosition } from "common/types/setup";

import Article from "../models/Article";
import CVMeta, { IArticlesUpdateEvent } from "./CVMeta";
import CVModel2 from "./CVModel2";
import { Dictionary } from "@ff/core/types";

////////////////////////////////////////////////////////////////////////////////

export { Article, EReaderPosition };

export interface IArticleEntry
{
    article: Article;
    category: string;
}

export default class CVReader extends Component
{
    static readonly typeName: string = "CVReader";

    protected static readonly ins = {
        enabled: types.Boolean("Reader.Enabled"),
        menu: types.Boolean("Reader.Menu"),
        position: types.Enum("Reader.Position", EReaderPosition),
        articleId: types.String("Article.ID"),
    };

    protected static readonly outs = {
        article: types.Object("Article.Active", Article),
        articleTitle: types.String("Article.Title"),
        articleLead: types.String("Article.Lead"),
    };

    ins = this.addInputs(CVReader.ins);
    outs = this.addOutputs(CVReader.outs);

    protected _articles: Dictionary<IArticleEntry>;

    get snapshotKeys() {
        return [ "enabled" ];
    }

    get articles() {
        return this._articles;
    }

    create()
    {
        super.create();
        this.graph.components.on(CVMeta, this.onInfoComponent, this);
        this.updateArticles();
    }

    dispose()
    {
        this.graph.components.off(CVMeta, this.onInfoComponent, this);
        super.dispose();
    }

    protected onInfoComponent(event: IComponentEvent<CVMeta>)
    {
        if (event.add) {
            event.object.articles.on<IArticlesUpdateEvent>("update", this.updateArticles, this);
        }
        if (event.remove) {
            event.object.articles.off<IArticlesUpdateEvent>("update", this.updateArticles, this);
        }

        this.updateArticles();
    }

    protected updateArticles()
    {
        const infos = this.getGraphComponents(CVMeta);
        const masterList = this._articles = {};

        infos.forEach(info => {
            const articles = info.articles;
            const model = info.getComponent(CVModel2, true);
            const category = model ? info.node.displayName : "";

            articles.items.forEach(article => {
                masterList[article.id] = { article, category };
            });
        });
    }

    fromData(data: IReader)
    {
        data = data || {} as IReader;

        this.ins.setValues({
            enabled: !!data.enabled,
            position: EReaderPosition[data.position] || EReaderPosition.Overlay,
            articleId: data.articleId,
        });
    }

    toData(): IReader
    {
        const ins = this.ins;

        return {
            enabled: ins.enabled.value,
            position: EReaderPosition[ins.position.value] || "Overlay",
            articleId: ins.articleId.value
        };
    }
}