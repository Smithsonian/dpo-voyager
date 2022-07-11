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
import FontReader, { IBitmapFont } from "../io/FontReader";

import CVAssetManager from "./CVAssetManager";

////////////////////////////////////////////////////////////////////////////////

export const DEFAULT_SYSTEM_ASSET_PATH = "https://cdn.jsdelivr.net/gh/smithsonian/dpo-voyager@latest/assets/";

export default class CVAssetReader extends Component
{
    static readonly typeName: string = "CVAssetReader";

    static readonly text: string = "AssetReader";
    static readonly icon: string = "";

    static readonly isSystemSingleton = true;

    readonly jsonLoader: JSONReader;
    readonly modelLoader: ModelReader;
    readonly geometryLoader: GeometryReader;
    readonly textureLoader: TextureReader;
    readonly fontReader: FontReader;

    private systemAssetPath = null;

    constructor(node: Node, id: string)
    {
        super(node, id);

        const loadingManager = this.assetManager.loadingManager;

        this.jsonLoader = new JSONReader(loadingManager);
        this.modelLoader = new ModelReader(loadingManager);
        this.geometryLoader = new GeometryReader(loadingManager);
        this.textureLoader = new TextureReader(loadingManager);
        this.fontReader = new FontReader(loadingManager);
    }

    dispose()
    {
        this.modelLoader.dispose();
        super.dispose();
    }

    protected get assetManager() {
        return this.getMainComponent(CVAssetManager);
    }

    setDracoPath(dracoPath: string)
    {
        this.modelLoader.dracoPath = dracoPath;
    }

    setSystemAssetPath(assetPath: string) // TODO: Move to CVAssetManager
    {
        this.fontReader.fontPath = assetPath;
        this.systemAssetPath = assetPath;
    }

    getSystemAssetUrl(assetPath: string) // TODO: Move to CVAssetManager
    {
        return (this.systemAssetPath || DEFAULT_SYSTEM_ASSET_PATH) + assetPath;
    }

    async getJSON(assetPath: string): Promise<any>
    {
        const url = this.assetManager.getAssetUrl(assetPath);
        return this.jsonLoader.get(url);
    }

    async getText(assetPath: string): Promise<string>
    {
        const url = this.assetManager.getAssetUrl(assetPath);
        return fetch.text(url, "GET");
    }

    async getModel(assetPath: string): Promise<THREE.Object3D>
    {
        const url = this.assetManager.getAssetUrl(assetPath);
        return this.modelLoader.get(url);
    }

    async getGeometry(assetPath: string): Promise<THREE.BufferGeometry>
    {
        const url = this.assetManager.getAssetUrl(assetPath);
        return this.geometryLoader.get(url);
    }

    async getTexture(assetPath: string): Promise<THREE.Texture>
    {
        const url = this.assetManager.getAssetUrl(assetPath);
        return this.textureLoader.get(url);
    }

    async getFont(assetPath: string): Promise<IBitmapFont>
    {
        const url = this.assetManager.getAssetUrl(assetPath);
        return this.fontReader.load(url);
    }

    async getSystemTexture(assetPath: string): Promise<THREE.Texture>
    {
        const url = this.getSystemAssetUrl(assetPath);
        return this.textureLoader.get(url);
    }

    async getSystemJSON(assetPath: string): Promise<any>
    {
        const url = this.getSystemAssetUrl(assetPath);
        return this.jsonLoader.get(url);
    }
}
