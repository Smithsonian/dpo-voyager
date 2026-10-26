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
import { HTTPError } from "../utils/errors";

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


    /**
     * Writes a file. Rejects with an [[HTTPError]] if the server refuses it: the file was not written. Rejects with a
     * "NetworkError" if no answer arrives: the server was unreachable or the connection was lost, maybe after the file
     * was received. Rejects with an "AbortError" if the signal aborts first.
     */
    async put(body: string|BlobPart, contentType :string, assetPath: string, {signal}:{signal?:AbortSignal}={}): Promise<void>
    {

        const standaloneManager = this.standaloneFileManager;
        if(standaloneManager) {
            standaloneManager.addFile(assetPath, [body]);
            return Promise.resolve();
        }

        const url = this.assetManager.getAssetUrl(assetPath);
        let res: Response;
        try {
            res = await fetch(url, {
                method: "PUT",
                headers:{
                    "Accept": "text/plain",
                    "Content-Type": contentType,
                },
                body,
                signal,
            });
        }
        catch (e) {
            if (e?.name === "AbortError") {
                throw e;
            }
            throw new DOMException(`Failed to reach ${url}: ${e?.message ?? e}`, "NetworkError");
        }
        if(!res.ok) {
            // The status is the answer; the explanation is a bonus that may fail to arrive.
            const txt = await res.text().catch(() => "");
            throw new HTTPError(url, res.status, txt || res.statusText);
        }
    }

    async putJSON(json: any, assetPath: string, {signal}:{signal?:AbortSignal}={}): Promise<void>
    {
        if (typeof json !== "string") {
            json = JSON.stringify(json);
        }
        return await this.put(json, "application/json", assetPath, {signal});
    }

    async putText(text: string, assetPath: string, {signal}:{signal?:AbortSignal}={}): Promise<void>
    {
        return await this.put(text, "text/plain", assetPath, {signal});
    }

    putDocument(document: CVDocument, components?: INodeComponents, assetPath?: string): Promise<void>
    {
        const documentData = document.deflateDocument(components);

        return this.putJSON(documentData, assetPath || document.outs.assetPath.value);
    }

}