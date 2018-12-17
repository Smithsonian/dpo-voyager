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

import Component, { IComponentChangeEvent } from "@ff/scene/Component";

import { IDocuments, IDocument as IDocumentData } from "common/types/item";

import Reader from "./Reader";

////////////////////////////////////////////////////////////////////////////////

export interface IDocumentChangeEvent extends IComponentChangeEvent<Documents>
{
    what: "add" | "remove";
    document: IDocument
}

export interface IDocument
{
    id?: string;
    title: string;
    description: string;
    mimeType: string;
    uri: string;
    thumbnailUri: string;
}

export default class Documents extends Component
{
    static readonly type: string = "Documents";

    protected mainDocument: IDocument;
    protected documents: Dictionary<IDocument> = {};
    protected documentList: IDocument[] = [];
    protected reader: Reader = null;

    create()
    {
        this.reader = this.system.components.get(Reader);
    }

    createDocument(): string
    {
        const document: IDocument = {
            title: "New Document",
            description: "",
            mimeType: "text/plain",
            uri: "",
            thumbnailUri: ""
        };

        return this.addDocument(document);
    }

    addDocument(document: IDocument): string
    {
        if (!document.id) {
            document.id = uniqueId();
        }

        this.documents[document.id] = document;
        this.documentList.push(document);
        this.reader.addDocument(document);

        this.emit<IDocumentChangeEvent>("change", { what: "add", document });

        return document.id;
    }

    removeDocument(id: string): IDocument
    {
        const document = this.documents[id];
        const index = this.documentList.indexOf(document);
        this.documentList.splice(index, 1);
        delete this.documents[id];
        this.reader.removeDocument(id);

        this.emit<IDocumentChangeEvent>("change", { what: "remove", document });

        return document;
    }

    getDocuments(): Readonly<IDocument[]>
    {
        return this.documentList;
    }

    fromData(data: IDocuments): string[]
    {
        const ids = data.documents.map(docData =>
            this.addDocument({
                title: docData.title,
                description: docData.description || "",
                mimeType: docData.mimeType || "",
                uri: docData.uri,
                thumbnailUri: docData.thumbnailUri || ""
            })
        );

        if (data.mainDocument !== undefined) {
            this.mainDocument = this.documentList[data.mainDocument];
        }

        return ids;
    }

    toData(): { data: IDocuments, ids: Dictionary<number> }
    {
        const result = { data: { documents: [] } as IDocuments, ids: {} };

        Object.keys(this.documents).forEach((key, index) => {
            const document = this.documents[key];
            result.ids[document.id] = index;

            const docData: IDocumentData = {
                title: document.title,
                uri: document.uri
            };

            if (document.description) {
                docData.description = document.description;
            }
            if (document.mimeType) {
                docData.mimeType = document.mimeType;
            }
            if (document.thumbnailUri) {
                docData.thumbnailUri = document.thumbnailUri;
            }

            result.data.documents.push(docData);
        });

        if (this.mainDocument) {
            result.data.mainDocument = result.ids[this.mainDocument.id];
        }

        return result;
    }
}