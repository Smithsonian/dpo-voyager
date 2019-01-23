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

import Publisher, { ITypedEvent } from "@ff/core/Publisher";

import { IDocument } from "common/types/item";

////////////////////////////////////////////////////////////////////////////////

export interface IDocumentUpdateEvent extends ITypedEvent<"update">
{
    document: Document;
}

export default class Document extends Publisher
{
    readonly id: string;

    title: string = "New Document";
    description: string = "";
    uri: string = "";
    mimeType: string = "";
    thumbnailUri: string = "";

    constructor(id: string)
    {
        super();
        this.addEvent("change");

        this.id = id;
    }

    update()
    {
        this.emit<IDocumentUpdateEvent>({ type: "update", document: this });
    }

    deflate(): IDocument
    {
        const data: Partial<IDocument> = { id: this.id };

        if (this.title) {
            data.title = this.title;
        }
        if (this.description) {
            data.description = this.description;
        }
        if (this.uri) {
            data.uri = this.uri;
        }
        if (this.mimeType) {
            data.mimeType = this.mimeType;
        }
        if (this.thumbnailUri) {
            data.thumbnailUri = this.thumbnailUri;
        }

        return data as IDocument;
    }

    inflate(data: IDocument): Document
    {
        this.title = data.title || "";
        this.description = data.description || "";
        this.uri = data.uri || "";
        this.mimeType = data.mimeType || "";
        this.thumbnailUri = data.thumbnailUri || "";

        return this;
    }
}