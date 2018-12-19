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
import * as THREE from "three";

import { IPresentation, IItem } from "common/types";
import Asset from "../models/Asset";

import JSONLoader from "./JSONLoader";
import JSONValidator from "./JSONValidator";
import ModelLoader from "./ModelLoader";
import GeometryLoader from "./GeometryLoader";
import TextureLoader from "./TextureLoader";

////////////////////////////////////////////////////////////////////////////////

export default class LoadingManager extends THREE.LoadingManager
{
    readonly jsonLoader: JSONLoader;
    readonly validator: JSONValidator;
    readonly modelLoader: ModelLoader;
    readonly geometryLoader: GeometryLoader;
    readonly textureLoader: TextureLoader;

    constructor()
    {
        super();

        this.onStart = this.onLoadingStart.bind(this);
        this.onProgress = this.onLoadingProgress.bind(this);
        this.onLoad = this.onLoadingCompleted.bind(this);
        this.onError = this.onLoadingError.bind(this);

        this.jsonLoader = new JSONLoader(this);
        this.validator = new JSONValidator();
        this.modelLoader = new ModelLoader(this);
        this.geometryLoader = new GeometryLoader(this);
        this.textureLoader = new TextureLoader(this);
    }

    loadJSON(url: string, path?: string): Promise<any>
    {
        url = resolvePathname(url, path);
        return this.jsonLoader.load(url);
    }

    loadModel(asset: Asset, path?: string): Promise<THREE.Object3D>
    {
        const url = resolvePathname(asset.uri, path);
        return this.modelLoader.load(url);
    }

    loadGeometry(asset: Asset, path?: string): Promise<THREE.Geometry>
    {
        const url = resolvePathname(asset.uri, path);
        return this.geometryLoader.load(url);
    }

    loadTexture(asset: Asset, path?: string): Promise<THREE.Texture>
    {
        const url = resolvePathname(asset.uri, path);
        return this.textureLoader.load(url);
    }

    validatePresentation(json: any): Promise<IPresentation>
    {
        return new Promise((resolve, reject) => {
            if (!this.validator.validatePresentation(json)) {
                return reject(new Error("invalid presentation data, validation failed"));
            }

            return resolve(json as IPresentation);
        });
    }

    validateItem(json: any): Promise<IItem>
    {
        return new Promise((resolve, reject) => {
            if (!this.validator.validateItem(json)) {
                return reject(new Error("invalid item data, validation failed"));
            }

            return resolve(json as IItem);
        });
    }

    protected onLoadingStart()
    {
        console.log("Loading files...");
    }

    protected onLoadingProgress(url, itemsLoaded, itemsTotal)
    {
        console.log(`Loaded ${itemsLoaded} of ${itemsTotal} files: ${url}`);
    }

    protected onLoadingCompleted()
    {
        console.log("Loading completed");
    }

    protected onLoadingError()
    {
        console.error(`Loading error`);
    }
}