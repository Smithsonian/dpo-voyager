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

import uniqueId from "@ff/core/uniqueId";
import { Dictionary } from "@ff/core/types";

import Component, { ITypedEvent } from "@ff/graph/Component";

import { IArticles } from "common/types/item";

import CVReader from "./CVReader";

import Article from "../models/Article";

////////////////////////////////////////////////////////////////////////////////

export { Article };

export interface IArticleEvent extends ITypedEvent<"article">
{
    add: boolean;
    remove: boolean;
    article: Article
}

export default class CVArticles extends Component
{
    static readonly typeName: string = "CVArticles";

    protected mainArticle: Article = null;
    protected articles: Dictionary<Article> = {};

    get reader() {
        return this.system.components.get(CVReader);
    }

    createArticle(): Article
    {
        const article = new Article(uniqueId(6, this.articles));

        this.addArticle(article);
        return article;
    }

    getArticles()
    {
        return Object.keys(this.articles).map(key => this.articles[key]);
    }

    getArticleById(id: string)
    {
        return this.articles[id];
    }

    addArticle(article: Article)
    {
        this.articles[article.id] = article;
        this.emit<IArticleEvent>({ type: "article", add: true, remove: false, article });
    }

    removeDocument(article: Article)
    {
        delete this.articles[article.id];
        this.emit<IArticleEvent>({ type: "article", add: false, remove: true, article });
    }

    deflate()
    {
        const data = this.toData();
        return data ? { data } : null;
    }

    inflate(json: any)
    {
        if (json.data) {
            this.fromData(json);
        }
    }

    toData(): IArticles | null
    {
        let data: Partial<IArticles> = null;

        if (this.mainArticle) {
            data = data || {};
            data.mainArticleId = this.mainArticle.id;
        }
        const articleIds = Object.keys(this.articles);

        if (articleIds.length > 0) {
            data = data || {};
            data.articles = articleIds.map(id => this.articles[id].deflate());
        }

        return data as IArticles;
    }

    fromData(data: IArticles)
    {
        if (data.articles) {
            data.articles.forEach(data => this.addArticle(new Article(data.id).inflate(data)));
        }

        if (data.mainArticleId) {
            this.mainArticle = this.articles[data.mainArticleId];
        }
    }
}