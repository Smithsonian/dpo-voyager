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

import resolvePathname from "resolve-pathname";

import Component from "@ff/graph/Component";

import { IDocument } from "common/types/document";
import { EDerivativeQuality } from "common/types/model";

import * as documentTemplate from "common/templates/document.json";

import CVAssetLoader from "./CVAssetLoader";
import CVDocumentProvider from "./CVDocumentProvider";
import CVDocument from "./CVDocument";

////////////////////////////////////////////////////////////////////////////////

export default class CVDocumentLoader extends Component
{
    static readonly typeName: string = "CVDocumentLoader";

    protected get documentProvider() {
        return this.components.get(CVDocumentProvider);
    }
    protected get activeDocument() {
        return this.documentProvider.activeComponent;
    }
    protected get assetLoader() {
        return this.getComponent(CVAssetLoader);
    }

    loadDocument(documentOrUrl: string | object): Promise<CVDocument | null>
    {
        const url = typeof documentOrUrl === "string" ? documentOrUrl : "";

        const getDocument = url ?
            this.assetLoader.loadDocumentData(url) :
            this.assetLoader.validateDocument(documentOrUrl as IDocument);

        return getDocument.then(documentData => this.openDocument(documentData, url));
    }

    openDefaultDocument(): Promise<CVDocument>
    {
        return this.assetLoader.validateDocument(documentTemplate)
            .then(documentData => this.openDocument(documentData));
    }

    mergeDocument(documentOrUrl: string | object): Promise<CVDocument | null>
    {
        return new Promise((resolve, reject) => {
            const document = this.activeDocument;
            if (!document) {
                reject(new Error("can't merge, no active document"));
            }

            const url = typeof documentOrUrl === "string" ? documentOrUrl : "";

            const getDocument = url ?
                this.assetLoader.loadDocumentData(url) :
                this.assetLoader.validateDocument(documentOrUrl as IDocument);

            getDocument.then(documentData => {
                document.mergeDocument(documentData);
                return document;
            })
        });
    }

    openDocument(documentData: IDocument, url?: string): Promise<CVDocument>
    {
        return new Promise((resolve, reject) => {
            const document = this.node.createComponent(CVDocument);
            document.openDocument(documentData, url);
            resolve(document);

        }).catch(error => {
            console.warn("Failed to open document", error);
            return null;
        });
    }


    loadModel(modelUrl: string, quality?: string): Promise<void>
    {
        let derivativeQuality = EDerivativeQuality[quality];
        if (!isFinite(derivativeQuality)) {
            derivativeQuality = EDerivativeQuality.Medium;
        }

        return new Promise((resolve, reject) => {
            const document = this.activeDocument;
            if (!document) {
                reject(new Error("can't load model, no active document"));
            }

            document.appendModel(modelUrl, derivativeQuality);
            resolve();
        });
    }

    loadGeometry(geoUrl: string, colorMapUrl?: string, occlusionMapUrl?: string, normalMapUrl?: string, quality?: string): Promise<void>
    {
        let derivativeQuality = EDerivativeQuality[quality];
        if (!isFinite(derivativeQuality)) {
            derivativeQuality = EDerivativeQuality.Medium;
        }

        return new Promise((resolve, reject) => {
            const document = this.activeDocument;
            if (!document) {
                reject(new Error("can't load geometry, no active document"));
            }

            document.appendGeometry(geoUrl, colorMapUrl, occlusionMapUrl, normalMapUrl, derivativeQuality);
            resolve();
        });
    }
}