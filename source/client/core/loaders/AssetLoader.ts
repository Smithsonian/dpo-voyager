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

import ModelLoader from "../three/ModelLoader";
import GeometryLoader from "../three/GeometryLoader";
import TextureLoader from "../three/TextureLoader";

import { IAsset } from "common/types/item";
import { EAssetType } from "../app/Asset";

////////////////////////////////////////////////////////////////////////////////

export default class AssetLoader
{
    protected modelLoader: ModelLoader;
    protected geometryLoader: GeometryLoader;
    protected textureLoader: TextureLoader;

    constructor(loadingManager: THREE.LoadingManager)
    {
        this.modelLoader = new ModelLoader(loadingManager);
        this.geometryLoader = new GeometryLoader(loadingManager);
        this.textureLoader = new TextureLoader(loadingManager);
    }

    loadModel(asset: IAsset, path?: string): Promise<THREE.Object3D>
    {
        const url = resolvePathname(asset.uri, path);
        return this.modelLoader.load(url);
    }

    loadGeometry(asset: IAsset, path?: string): Promise<THREE.Geometry>
    {
        const url = resolvePathname(asset.uri, path);
        return this.geometryLoader.load(url);
    }

    loadTexture(asset: IAsset, path?: string): Promise<THREE.Texture>
    {
        const url = resolvePathname(asset.uri, path);
        return this.textureLoader.load(url);
    }

    getAssetType(asset: IAsset): EAssetType
    {
        if (asset.type) {
            return EAssetType[asset.type];
        }

        if (asset.mimeType) {
            if (asset.mimeType === "model/gltf+json" || asset.mimeType === "model/gltf-binary") {
                return EAssetType.Model;
            }
            if (asset.mimeType === "image/jpeg" || asset.mimeType === "image/png") {
                return EAssetType.Image;
            }
        }

        const extension = asset.uri.split(".").pop().toLowerCase();

        if (extension === "gltf" || extension === "glb") {
            return EAssetType.Model
        }
        if (extension === "obj" || extension === "ply") {
            return EAssetType.Geometry
        }
        if (extension === "jpg" || extension === "png") {
            return EAssetType.Image;
        }

        throw new Error(`failed to determine asset type from asset: ${asset.uri}`);
    }
}