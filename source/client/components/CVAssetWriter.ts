/**
 * 3D Foundation Project
 * Copyright 2019 Smithsonian Institution
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

import fetch from "@ff/browser/fetch";
import Component, { Node } from "@ff/graph/Component";

import JSONWriter from "../io/JSONWriter";
import { INodeComponents } from "../nodes/NVNode";

import CVDocument from "./CVDocument";
import CVAssetManager from "./CVAssetManager";
import CVStandaloneFileManager from "./CVStandaloneFileManager"
import CVAssetReader from "./CVAssetReader";
import { resolve } from "dns";

////////////////////////////////////////////////////////////////////////////////

export default class CVAssetWriter extends Component
{
    static readonly typeName: string = "CVAssetWriter";

    static readonly text: string = "AssetWriter";
    static readonly icon: string = "";

    static readonly isSystemSingleton = true;

    protected jsonWriter: JSONWriter;


    constructor(node: Node, id: string)
    {
        super(node, id);

        const loadingManager = this.assetManager.loadingManager;

        this.jsonWriter = new JSONWriter(loadingManager);
    }

    protected get assetManager() {
        return this.getMainComponent(CVAssetManager);
    }
    protected get standaloneFileManager() {
        return this.getGraphComponent(CVStandaloneFileManager, true);
    }

    putJSON(json: any, assetPath: string): Promise<void>
    {
        const url = this.assetManager.getAssetUrl(assetPath);
        return this.jsonWriter.put(json, url);
    }

    putText(text: string, assetPath: string): Promise<string>
    {
        const standaloneManager = this.standaloneFileManager;
        if(standaloneManager) {
            standaloneManager.addFile(assetPath, [text]);
            return Promise.resolve(text);
        }
        else {
            const url = this.assetManager.getAssetUrl(assetPath);
            return fetch.text(url, "PUT", text);
        }
    }

    putDocument(document: CVDocument, components?: INodeComponents, assetPath?: string): Promise<void>
    {
        const url = this.assetManager.getAssetUrl(assetPath || document.outs.assetPath.value);
        const documentData = document.deflateDocument(components);

        return this.jsonWriter.put(documentData, url)
    }

}