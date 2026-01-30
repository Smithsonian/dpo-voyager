/**
 * 3D Foundation Project
 * Copyright 2025 Smithsonian Institution
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

import Component, { Node } from "@ff/graph/Component";

import { INodeComponents } from "../nodes/NVNode";

import CVDocument from "./CVDocument";
import CVAssetManager from "./CVAssetManager";
import CVStandaloneFileManager from "./CVStandaloneFileManager"


////////////////////////////////////////////////////////////////////////////////

export default class CVAssetWriter extends Component
{
    static readonly typeName: string = "CVAssetWriter";

    static readonly text: string = "AssetWriter";
    static readonly icon: string = "";

    static readonly isSystemSingleton = true;



    constructor(node: Node, id: string)
    {
        super(node, id);

        const loadingManager = this.assetManager.loadingManager;

    }

    protected get assetManager() {
        return this.getMainComponent(CVAssetManager);
    }
    protected get standaloneFileManager() {
        return this.getGraphComponent(CVStandaloneFileManager, true);
    }

    protected async createDirectory(assetPath: string) {
        const dir = assetPath.substring(0, assetPath.lastIndexOf('/'));
        if (dir) {
            const url = this.assetManager.getAssetUrl(dir);
            const response = await fetch(url, { method: "MKCOL" });
            if (response.status === 405) {
                console.debug(`Directory ${dir} at ${url} already exists.`);
                return;
            } else if (!response.ok) {
                throw new Error(`Failed to create directory ${dir} at ${url}: ${response.statusText}`);
            }
        } else {
            console.debug(`No directory to create for asset path: ${assetPath}`);
        }
    }

    async put(body: string|BlobPart, contentType :string, assetPath: string): Promise<void>
    {

        const standaloneManager = this.standaloneFileManager;
        if(standaloneManager) {
            standaloneManager.addFile(assetPath, [body]);
            return Promise.resolve();
        }

        await this.createDirectory(assetPath);

        const url = this.assetManager.getAssetUrl(assetPath);
        const res = await fetch(url, {
            method: "PUT",
            headers:{
                "Accept": "text/plain",
                "Content-Type": contentType,
            },
            body,
        });
        if(!res.ok) {
            const txt = await res.text();
            throw new Error(`Failed to PUT ${contentType} to ${url}: ${txt ?? res.statusText}`);
        }
    }

    async putJSON(json: any, assetPath: string): Promise<void>
    {
        if (typeof json !== "string") {
            json = JSON.stringify(json);
        }
        return await this.put(json, "application/json", assetPath);
    }

    async putText(text: string, assetPath: string): Promise<void>
    {
        return await this.put(text, "text/plain", assetPath);
    }

    putDocument(document: CVDocument, components?: INodeComponents, assetPath?: string): Promise<void>
    {
        const documentData = document.deflateDocument(components);

        return this.putJSON(documentData, assetPath || document.outs.assetPath.value);
    }

}