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

import JSONReader from "../io/JSONReader";
import ModelReader from "../io/ModelReader";
import GeometryReader from "../io/GeometryReader";
import TextureReader from "../io/TextureReader";

import CVAssetManager from "./CVAssetManager";

////////////////////////////////////////////////////////////////////////////////

export default class CVAssetReader extends Component
{
    static readonly typeName: string = "CVAssetReader";

    static readonly text: string = "AssetReader";
    static readonly icon: string = "";

    static readonly isSystemSingleton = true;

    protected jsonLoader: JSONReader;
    protected modelLoader: ModelReader;
    protected geometryLoader: GeometryReader;
    protected textureLoader: TextureReader;


    constructor(node: Node, id: string)
    {
        super(node, id);

        const loadingManager = this.assetManager.loadingManager;

        this.jsonLoader = new JSONReader(loadingManager);
        this.modelLoader = new ModelReader(loadingManager);
        this.geometryLoader = new GeometryReader(loadingManager);
        this.textureLoader = new TextureReader(loadingManager);
    }

    protected get assetManager() {
        return this.getMainComponent(CVAssetManager);
    }

    getJSON(assetPath: string): Promise<any>
    {
        const url = this.assetManager.getAssetUrl(assetPath);
        return this.jsonLoader.get(url);
    }

    getText(assetPath: string): Promise<string>
    {
        const url = this.assetManager.getAssetUrl(assetPath);
        return fetch.text(url, "GET");
    }

    getModel(assetPath: string): Promise<THREE.Object3D>
    {
        const url = this.assetManager.getAssetUrl(assetPath);
        return this.modelLoader.get(url);
    }

    getGeometry(assetPath: string): Promise<THREE.Geometry>
    {
        const url = this.assetManager.getAssetUrl(assetPath);
        return this.geometryLoader.get(url);
    }

    getTexture(assetPath: string): Promise<THREE.Texture>
    {
        const url = this.assetManager.getAssetUrl(assetPath);
        return this.textureLoader.get(url);
    }
}
