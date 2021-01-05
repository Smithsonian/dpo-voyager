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

import Document, { IDocumentDisposeEvent, IDocumentUpdateEvent } from "@ff/core/Document";

import { IArticle } from "client/schema/meta";
import { ELanguageType } from "client/schema/setup";

////////////////////////////////////////////////////////////////////////////////

export { IArticle };

export type IArticleUpdateEvent = IDocumentUpdateEvent<Article>;
export type IArticleDisposeEvent = IDocumentDisposeEvent<Article>;

export default class Article extends Document<IArticle>
{
    private _language : ELanguageType = ELanguageType.EN;

    static fromJSON(json: IArticle)
    {
        return new Article(json);
    }

    toString()
    {
        return this.data.title;
    }

    get title() {
        return Object.keys(this.data.titles).length > 0 ? this.data.titles[ELanguageType[this.language]] : this.data.title;
    }
    get uri() {
        return Object.keys(this.data.uris).length > 0 ? this.data.uris[ELanguageType[this.language]] : this.data.uri;
    }
    get lead() {
        return Object.keys(this.data.leads).length > 0 ? this.data.leads[ELanguageType[this.language]] : this.data.lead;
    }
    get language() {
        return this._language;
    }
    set language(newLanguage: ELanguageType) {
        this._language = newLanguage;
    }

    protected init()
    {
        return {
            id: Document.generateId(),
            title: "New Article",
            titles: {},
            lead: "",
            leads: {},
            tags: [],
            uri: "",
            uris: {},
            mimeType: "",
            thumbnailUri: "",
        }
    }

    protected deflate(data: IArticle, json: IArticle)
    {
        json.id = data.id;
        json.uri = data.uri;
        if(data.uris) {
            json.uris = data.uris;
        }

        if (data.title) {
            json.title = data.title;
        }
        if (Object.keys(this.data.titles).length > 0) {
            json.titles = data.titles;
        }
        if (data.lead) {
            json.lead = data.lead;
        }
        if (Object.keys(this.data.leads).length > 0) {
            json.leads = data.leads;
        }
        if (data.tags.length > 0) {
            json.tags = data.tags.slice();
        }
        if (data.mimeType) {
            json.mimeType = data.mimeType;
        }
        if (data.thumbnailUri) {
            json.thumbnailUri = data.thumbnailUri;
        }
    }

    protected inflate(json: IArticle, data: IArticle)
    {
        data.id = json.id;
        data.uri = json.uri;
        data.uris = json.uris || {};

        data.title = json.title || "";
        data.titles = json.titles || {};
        data.lead = json.lead || "";
        data.leads = json.leads || {};
        data.tags = json.tags || [];
        data.mimeType = json.mimeType || "";
        data.thumbnailUri = json.thumbnailUri || "";
    }
}