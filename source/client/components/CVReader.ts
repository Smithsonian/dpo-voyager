/**
 * 3D Foundation Project
 * Copyright 2019 Smithsonian Institution
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
import NVNode from "../nodes/NVNode";
import CVAssetReader from "./CVAssetReader";

////////////////////////////////////////////////////////////////////////////////

export { Article, EReaderPosition };

export interface IArticleEntry
{
    article: Article;
    node: NVNode;
}

export default class CVReader extends Component
{
    static readonly typeName: string = "CVReader";

    static readonly text: string = "Reader";
    static readonly icon: string = "";

    protected static readonly ins = {
        enabled: types.Boolean("Reader.Enabled"),
        position: types.Enum("Reader.Position", EReaderPosition),
        articleId: types.String("Article.ID"),
    };

    protected static readonly outs = {
        article: types.Object("Article.Active", Article),
        content: types.String("Article.Content"),
        node: types.Object("Article.Node", NVNode),
    };

    ins = this.addInputs(CVReader.ins);
    outs = this.addOutputs(CVReader.outs);

    get settingProperties() {
        return [
            this.ins.enabled,
            this.ins.position,
        ];
    }

    get snapshotProperties() {
        return [
            this.ins.enabled,
            this.ins.articleId,
        ];
    }

    get articles() {
        return Object.keys(this._articles).map(key => this._articles[key]);
    }
    get activeArticle() {
        return this.outs.article.value;
    }

    protected get assetReader() {
        return this.getMainComponent(CVAssetReader);
    }

    protected _articles: Dictionary<IArticleEntry>;

    create()
    {
        super.create();
        this.graph.components.on(CVMeta, this.onMetaComponent, this);
        this.updateArticles();
    }

    dispose()
    {
        this.graph.components.off(CVMeta, this.onMetaComponent, this);
        super.dispose();
    }

    update(context)
    {
        const ins = this.ins;
        const outs = this.outs;

        if (ins.articleId.changed) {
            const entry = this._articles[ins.articleId.value] || null;
            const article = entry && entry.article;
            outs.node.setValue(entry && entry.node);
            outs.article.setValue(article);
            outs.content.setValue("");

            if (article) {
                this.readArticle(article);
            }
        }

        return true;
    }

    protected readArticle(article: Article)
    {
        const outs = this.outs;
        const uri = article.data.uri;

        if (!uri) {
            outs.content.setValue(`<h2>Can't display article: no URI.</h2>`);
            return;
        }

        return this.assetReader.getText(uri)
        .then(content => outs.content.setValue(content.replace(/[\n\r]/g, "")))
        .catch(error => outs.content.setValue(`<h2>Article not found at ${uri}</h2>`));
    }

    protected onMetaComponent(event: IComponentEvent<CVMeta>)
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
        const metas = this.getGraphComponents(CVMeta);
        const masterList = this._articles = {};

        metas.forEach(meta => {
            const articles = meta.articles;
            const node = meta.node;

            articles.items.forEach(article => {
                masterList[article.id] = { article, node };
            });
        });

        const firstMeta = metas[0];
        if (firstMeta && firstMeta.leadArticle) {
            this.ins.articleId.setValue(firstMeta.leadArticle.id);
        }
        else {
            this.ins.articleId.setValue("");
        }
    }

    fromData(data: IReader)
    {
        data = data || {} as IReader;

        this.ins.setValues({
            enabled: !!data.enabled,
            position: EReaderPosition[data.position] || EReaderPosition.Overlay,
            articleId: data.articleId || "",
        });
    }

    toData(): IReader
    {
        const ins = this.ins;

        const data: Partial<IReader> = {
            enabled: ins.enabled.value,
            position: EReaderPosition[ins.position.value] || "Overlay",
        };

        if (ins.articleId.value) {
            data.articleId = ins.articleId.value;
        }

        return data as IReader;
    }
}