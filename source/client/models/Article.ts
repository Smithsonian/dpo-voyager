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

import Document, { IDocumentDisposeEvent, IDocumentUpdateEvent } from "@ff/core/Document";

import { IArticle } from "common/types/info";

////////////////////////////////////////////////////////////////////////////////

export { IArticle };

export type IArticleUpdateEvent = IDocumentUpdateEvent<Article>;
export type IArticleDisposeEvent = IDocumentDisposeEvent<Article>;

export default class Article extends Document<IArticle>
{
    static fromJSON(json: IArticle)
    {
        return new Article(json);
    }

    protected init()
    {
        return {
            id: this.generateId(),
            title: "New Article",
            lead: "",
            tags: [],
            uri: "",
            mimeType: "",
            thumbnailUri: "",
        }
    }

    protected deflate(data: IArticle, json: IArticle)
    {
        json.id = data.id;
        json.uri = data.uri;

        if (data.title) {
            json.title = data.title;
        }
        if (data.lead) {
            json.lead = data.lead;
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

        data.title = json.title || "";
        data.lead = json.lead || "";
        data.tags = json.tags || [];
        data.mimeType = json.mimeType || "";
        data.thumbnailUri = json.thumbnailUri || "";
    }
}