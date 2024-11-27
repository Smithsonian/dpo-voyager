/**
 * 3D Foundation Project
 * Copyright 2024 Smithsonian Institution
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

import FileReader from "../io/FileReader";
import ModelReader from "../io/ModelReader";
import GeometryReader from "../io/GeometryReader";
import TextureReader from "../io/TextureReader";
import FontReader, { IBitmapFont } from "../io/FontReader";

import CVAssetManager from "./CVAssetManager";
import CRenderer from "@ff/scene/components/CRenderer";
import { Object3D, BufferGeometry, Texture } from "three";

////////////////////////////////////////////////////////////////////////////////

export const DEFAULT_SYSTEM_ASSET_PATH = "https://cdn.jsdelivr.net/gh/smithsonian/dpo-voyager@latest/assets/";

export default class CVAssetReader extends Component
{
    static readonly typeName: string = "CVAssetReader";

    static readonly text: string = "AssetReader";
    static readonly icon: string = "";

    static readonly isSystemSingleton = true;

    readonly fileLoader: FileReader;
    readonly modelLoader: ModelReader;
    readonly geometryLoader: GeometryReader;
    readonly textureLoader: TextureReader;
    readonly fontReader: FontReader;

    private systemAssetPath = null;

    constructor(node: Node, id: string)
    {
        super(node, id);

        const loadingManager = this.assetManager.loadingManager;

        this.fileLoader = new FileReader(loadingManager);
        this.modelLoader = new ModelReader(loadingManager, this.renderer);
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

    protected get renderer(){
        return this.getMainComponent(CRenderer);
    }

    setDracoPath(dracoPath: string)
    {
        this.modelLoader.dracoPath = dracoPath;
    }

    setSystemAssetPath(assetPath: string) // TODO: Move to CVAssetManager
    {
        this.fontReader.fontPath = assetPath;
        this.systemAssetPath = assetPath;
        this.modelLoader.setAssetPath(assetPath);
    }

    getSystemAssetUrl(assetPath: string) // TODO: Move to CVAssetManager
    {
        return (this.systemAssetPath || DEFAULT_SYSTEM_ASSET_PATH) + assetPath;
    }

    async getJSON(assetPath: string): Promise<any>
    {
        const url = this.assetManager.getAssetUrl(assetPath);
        return this.fileLoader.getJSON(url);
    }

    async getText(assetPath: string): Promise<string>
    {
        const url = this.assetManager.getAssetUrl(assetPath);
        return this.fileLoader.getText(url);
    }

    async getModel(assetPath: string, {signal}:{signal?:AbortSignal}={}): Promise<Object3D>
    {
        const url = this.assetManager.getAssetUrl(assetPath);
        return this.modelLoader.get(url, {signal});
    }

    async getGeometry(assetPath: string): Promise<BufferGeometry>
    {
        const url = this.assetManager.getAssetUrl(assetPath);
        return this.geometryLoader.get(url);
    }

    async getTexture(assetPath: string): Promise<Texture>
    {
        const url = this.assetManager.getAssetUrl(assetPath);
        return this.textureLoader.get(url);
    }

    async getFont(assetPath: string): Promise<IBitmapFont>
    {
        const url = this.assetManager.getAssetUrl(assetPath);
        return this.fontReader.load(url);
    }

    async getSystemTexture(assetPath: string): Promise<Texture>
    {
        const url = this.getSystemAssetUrl(assetPath);
        return this.textureLoader.get(url);
    }

    async getSystemJSON(assetPath: string): Promise<any>
    {
        const url = this.getSystemAssetUrl(assetPath);
        return this.fileLoader.getJSON(url);
    }
}
