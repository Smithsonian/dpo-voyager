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

import { Dictionary } from "@ff/core/types";
import { IComponentChangeEvent } from "@ff/core/ecs/Component";

import { IDocument as IDocumentData } from "common/types/item";

import Collection from "./Collection";

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

export default class Documents extends Collection<IDocument>
{
    static readonly type: string = "Documents";

    protected rootCollection: Documents = null;

    create()
    {
        this.rootCollection = this.findRootCollection();
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
        const id = this.insert(document);

        if (this.rootCollection) {
            this.rootCollection.addDocument(document);
        }

        this.emit<IDocumentChangeEvent>("change", { what: "add", document });

        return id;
    }

    removeDocument(id: string): IDocument
    {
        const document = this.remove(id);

        if (this.rootCollection) {
            this.rootCollection.removeDocument(id);
        }

        this.emit<IDocumentChangeEvent>("change", { what: "remove", document });

        return document;
    }

    fromData(data: IDocumentData[]): string[]
    {
        return data.map(docData =>
            this.addDocument({
                title: docData.title,
                description: docData.description || "",
                mimeType: docData.mimeType || "",
                uri: docData.uri,
                thumbnailUri: docData.thumbnailUri || ""
            })
        );
    }

    toData(): { data: IDocumentData[], ids: Dictionary<number> }
    {
        const documents = this.toArray();
        const result = { data: [], ids: {} };

        documents.forEach((document, index) => {

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

            result.data.push(docData);
        });

        return result;
    }
}