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

import { IDocuments } from "common/types/item";

import CVReader from "./CVReader";

import Document from "../models/Document";

////////////////////////////////////////////////////////////////////////////////

export interface IDocumentEvent extends ITypedEvent<"document">
{
    add: boolean;
    remove: boolean;
    document: Document
}

export default class CVDocuments extends Component
{
    protected mainDocument: Document = null;
    protected documents: Dictionary<Document> = {};

    get reader() {
        return this.system.components.get(CVReader);
    }

    createDocument(): Document
    {
        const document = new Document(uniqueId(6, this.documents));

        this.addDocument(document);
        return document;
    }

    getDocuments()
    {
        return Object.keys(this.documents).map(key => this.documents[key]);
    }

    getDocumentById(id: string)
    {
        return this.documents[id];
    }

    addDocument(document: Document)
    {
        this.documents[document.id] = document;
        this.emit<IDocumentEvent>({ type: "document",add: true, remove: false, document });
    }

    removeDocument(document: Document)
    {
        delete this.documents[document.id];
        this.emit<IDocumentEvent>({ type: "document", add: false, remove: true, document });
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

    toData(): IDocuments | null
    {
        let data: Partial<IDocuments> = null;

        if (this.mainDocument) {
            data = data || {};
            data.mainDocumentId = this.mainDocument.id;
        }
        const documentIds = Object.keys(this.documents);

        if (documentIds.length > 0) {
            data = data || {};
            data.documents = documentIds.map(id => this.documents[id].deflate());
        }

        return data as IDocuments;
    }

    fromData(data: IDocuments)
    {
        if (data.documents) {
            data.documents.forEach(data => this.addDocument(new Document(data.id).inflate(data)));
        }

        if (data.mainDocumentId) {
            this.mainDocument = this.documents[data.mainDocumentId];
        }
    }
}