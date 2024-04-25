/**
 * 3D Foundation Project
 * Copyright 2024 Smithsonian Institution
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

import { Dictionary } from "@ff/core/types";
import Component, { IComponentEvent, types } from "@ff/graph/Component";

import { IReader, EReaderPosition } from "client/schema/setup";

import Article from "../models/Article";

//import NVNode from "../nodes/NVNode";

import CVMeta, { IArticlesUpdateEvent } from "./CVMeta";
import CVAssetManager from "./CVAssetManager";
import CVAssetReader from "./CVAssetReader";
import CVAnalytics from "./CVAnalytics";

import CVLanguageManager from "./CVLanguageManager";

////////////////////////////////////////////////////////////////////////////////

export { Article, EReaderPosition };

export interface IArticleEntry
{
    article: Article;
    //node: NVNode;
}

export default class CVReader extends Component
{
    static readonly typeName: string = "CVReader";

    static readonly text: string = "Reader";
    static readonly icon: string = "";

    protected static readonly ins = {
        enabled: types.Boolean("Reader.Enabled"),
        visible: types.Boolean("Reader.Visible", true), // TODO: Swap enabled and visible
        closed: types.Event("Reader.Closed"),
        refresh: types.Event("Reader.Refresh"),
        position: types.Enum("Reader.Position", EReaderPosition),
        articleId: types.String("Article.ID"),
        focus: types.Boolean("Reader.Focus"),
    };

    protected static readonly outs = {
        article: types.Object("Article.Active", Article),
        content: types.String("Article.Content"),
        count: types.Integer("Article.Count"),
        //node: types.Object("Article.Node", NVNode),
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
            this.ins.position,
            this.ins.articleId,
        ];
    }

    get articles() {
        return Object.keys(this._articles).map(key => this._articles[key]);
    }
    get activeArticle() {
        return this.outs.article.value;
    }

    protected get assetManager() {
        return this.getMainComponent(CVAssetManager);
    }
    protected get assetReader() {
        return this.getMainComponent(CVAssetReader);
    }
    protected get analytics() {
        return this.getMainComponent(CVAnalytics);
    }
    protected get language() {
        return this.getGraphComponent(CVLanguageManager);
    }

    protected _articles: Dictionary<IArticleEntry>;

    create()
    {
        super.create();
        this.getGraphComponents(CVMeta).forEach(meta => meta.on<IArticlesUpdateEvent>("update", this.updateArticles, this));
        this.graph.components.on(CVMeta, this.onMetaComponent, this);
        this.graph.components.on(CVLanguageManager, this.onLanguageComponent, this);
        this.updateArticles();
    }

    dispose()
    {
        this.graph.components.off(CVLanguageManager, this.onLanguageComponent, this);
        this.graph.components.off(CVMeta, this.onMetaComponent, this);
        this.getGraphComponents(CVMeta).forEach(meta => meta.off<IArticlesUpdateEvent>("update", this.updateArticles, this));
        super.dispose();
    }

    update(context)
    {
        const ins = this.ins;
        const outs = this.outs;

        if (ins.enabled.changed) {
            //this.analytics.sendProperty("Reader.Enabled", ins.enabled.value);
        }
        if (ins.articleId.changed) {
            const entry = this._articles[ins.articleId.value] || null;
            const article = entry && entry.article;
            //outs.node.setValue(entry && entry.node);
            outs.article.setValue(article);
            outs.content.setValue("");

            if (article) {
                this.readArticle(article);
                this.analytics.sendProperty("Reader_ArticleId", article.defaultTitle);
            }
        }
        if (ins.refresh.changed) {
            this.refreshArticle();
        }

        return true;
    }

    protected readArticle(article: Article): Promise<void>
    {
        const outs = this.outs;
        const uri = article.uri;

        if (!uri) {
            outs.content.setValue(`<h2>Can't display article: no URI.</h2>`);
            return;
        }

        return this.assetReader.getText(uri)
        .then(content => this.parseArticle(content, uri))
        .then(content => outs.content.setValue(content))
        .catch(error => outs.content.setValue(`<h2>Article not found at ${uri}</h2>`));
    }

    protected parseArticle(content: string, articlePath: string): Promise<string>
    {
        // remove line breaks
        content = content.replace(/[\n\r]/g, "");

        // transform article-relative to absolute URLs
        const articleBasePath = this.assetManager.getAssetBasePath(articlePath);

        content = content.replace(/(src=\")(.*?)(\")/g, (match, pre, assetUrl, post) => {
            if (!assetUrl.startsWith("/") && !assetUrl.startsWith("http")) {
                assetUrl = this.assetManager.getAssetUrl(articleBasePath + assetUrl);
            }
            return pre + assetUrl + post;
        });

        return Promise.resolve(content);
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

    protected onLanguageComponent(event: IComponentEvent<CVLanguageManager>)
    {
        if (event.add) {
            event.object.outs.language.on("value", this.updateLanguage, this);
        }
        if (event.remove) {
            event.object.outs.language.off("value", this.updateLanguage, this);
        }
    }

    protected refreshArticle()
    {
        const entry = this._articles[this.ins.articleId.value] || null;
        const article = entry && entry.article;

        if(article) {
            this.readArticle(article);
        }
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
    }

    protected updateLanguage()
    {
        const ins = this.ins;
        // update articles
        this.articles.forEach( entry => {
            entry.article.language = this.language.outs.language.value;
        });

        // reader active article update
        this.ins.refresh.set();
    }

    fromData(data: IReader)
    {
        data = data || {} as IReader;

        this.ins.setValues({
            enabled: !!data.enabled,
            position: EReaderPosition[data.position] || EReaderPosition.Overlay,
            //articleId: data.articleId || "",
        });
    }

    toData(): IReader
    {
        const ins = this.ins;

        const data: Partial<IReader> = {
            enabled: ins.enabled.value,
            position: EReaderPosition[ins.position.value] || "Overlay",
        };

        /*if (ins.articleId.value) {
            data.articleId = ins.articleId.value;
        }*/

        return data as IReader;
    }
}