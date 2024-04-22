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

import Document, { IDocumentDisposeEvent, IDocumentUpdateEvent } from "@ff/core/Document";

import { IArticle } from "client/schema/meta";
import { ELanguageType, DEFAULT_LANGUAGE } from "client/schema/common";

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
        return this.title;
    }

    get title() {
        // TODO: Temporary - remove when single string properties are phased out
        if(Object.keys(this.data.titles).length === 0) {
            this.data.titles[DEFAULT_LANGUAGE] = this.data.title;
        }

        return this.data.titles[ELanguageType[this.language]] || "undefined";
    }
    set title(inTitle: string) {
        this.data.titles[ELanguageType[this.language]] = inTitle;
        this.update();
    }
    get defaultTitle() {
        // TODO: Temporary - remove when single string properties are phased out
        if(Object.keys(this.data.titles).length === 0) {
            this.data.titles[DEFAULT_LANGUAGE] = this.data.title;
        }

        return this.data.titles[DEFAULT_LANGUAGE] || "undefined";
    }
    get uri() {
        // TODO: Temporary - remove when single string properties are phased out
        if(Object.keys(this.data.uris).length === 0) {
            this.data.uris[DEFAULT_LANGUAGE] = this.data.uri;
        }

        return this.data.uris[ELanguageType[this.language]];
    }
    set uri(inUri: string) {
        this.data.uris[ELanguageType[this.language]] = inUri;
        this.update();
    }
    get lead() {
        // TODO: Temporary - remove when single string properties are phased out
        if(Object.keys(this.data.leads).length === 0) {
            this.data.leads[DEFAULT_LANGUAGE] = this.data.lead;
        }

        return this.data.leads[ELanguageType[this.language]] || "";
    }
    set lead(inLead: string) {
        this.data.leads[ELanguageType[this.language]] = inLead;
        this.update();
    }
    get tags() {
        // TODO: Temporary - remove when single string properties are phased out
        if(Object.keys(this.data.taglist).length === 0) {
            if(this.data.tags.length > 0) {
                this.data.taglist[DEFAULT_LANGUAGE] = this.data.tags;
            }
        }

        return this.data.taglist[ELanguageType[this.language]] || [];
    }
    set tags(inTags: string[]) {
        this.data.taglist[ELanguageType[this.language]] = inTags;
        this.update();
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
            taglist: {},
            uri: "",
            uris: {},
            mimeType: "",
            thumbnailUri: "",
        }
    }

    protected deflate(data: IArticle, json: IArticle)
    {
        json.id = data.id;
        
        if(Object.keys(this.data.uris).length > 0) {
            json.uris = {};
            Object.keys(this.data.uris).forEach( key => {
                json.uris[key] = data.uris[key];
            })
        }
        else if(data.uri) {
            json.uri = data.uri;
        }   

        if (Object.keys(this.data.titles).length > 0) {
            json.titles = {};
            Object.keys(this.data.titles).forEach( key => {
                json.titles[key] = data.titles[key];
            })
        }
        else if (data.title) {
            json.title = data.title;
        }

        if (Object.keys(this.data.leads).length > 0) {
            json.leads = {};
            Object.keys(this.data.leads).forEach( key => {
                json.leads[key] = data.leads[key];
            })
        }
        else if (data.lead) {
            json.lead = data.lead;
        }

        if (Object.keys(this.data.taglist).length > 0) {
            json.taglist = {};
            Object.keys(this.data.taglist).forEach( key => {
                json.taglist[key] = data.taglist[key].slice();
            })
        }
        else if (data.tags.length > 0) {
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
        data.uri = json.uri || "";
        data.uris = json.uris || {};

        data.title = json.title || "";
        data.titles = json.titles || {};
        data.lead = json.lead || "";
        data.leads = json.leads || {};
        data.tags = json.tags || [];
        data.taglist = json.taglist || {};
        data.mimeType = json.mimeType || "";
        data.thumbnailUri = json.thumbnailUri || "";
    }
}