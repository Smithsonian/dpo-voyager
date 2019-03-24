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
import Publisher, { ITypedEvent } from "@ff/core/Publisher";

import { IArticle } from "common/types/info";

////////////////////////////////////////////////////////////////////////////////


export interface IArticleUpdateEvent extends ITypedEvent<"update">
{
    article: Article;
}

export default class Article extends Publisher implements IArticle
{
    static fromJSON(json: IArticle)
    {
        return new Article(json.id).fromJSON(json);
    }

    id: string;
    title: string = "New Article";
    lead: string = "";
    tags: string[] = [];
    uri: string = "";
    mimeType: string = "";
    thumbnailUri: string = "";

    constructor(id?: string)
    {
        super();
        this.addEvent("update");

        this.id = id || uniqueId();
    }

    update()
    {
        this.emit<IArticleUpdateEvent>({ type: "update", article: this });
    }

    toJSON(): IArticle
    {
        const data: Partial<IArticle> = {
            id: this.id,
            uri: this.uri,
        };

        if (this.title) {
            data.title = this.title;
        }
        if (this.lead) {
            data.lead = this.lead;
        }
        if (this.tags.length > 0) {
            data.tags = this.tags.slice();
        }
        if (this.mimeType) {
            data.mimeType = this.mimeType;
        }
        if (this.thumbnailUri) {
            data.thumbnailUri = this.thumbnailUri;
        }

        return data as IArticle;
    }

    fromJSON(data: IArticle): Article
    {
        this.id = data.id;
        this.uri = data.uri;

        this.title = data.title || "";
        this.lead = data.lead || "";
        this.tags = data.tags || [];
        this.mimeType = data.mimeType || "";
        this.thumbnailUri = data.thumbnailUri || "";

        return this;
    }
}