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

import * as THREE from "three";

import {
    IAsset,
    AssetType,
    DerivativeUsage,
    DerivativeQuality
} from "common/types/item";

import AssetLoader from "../loaders/AssetLoader";
import UberMaterial from "../shaders/UberMaterial";

////////////////////////////////////////////////////////////////////////////////

export default class Derivative
{
    id: string;
    usage: DerivativeUsage;
    quality: DerivativeQuality;
    assets: IAsset[];

    constructor(usage: DerivativeUsage, quality: DerivativeQuality, assets?: IAsset[])
    {
        this.id = "";
        this.usage = usage;
        this.quality = quality;
        this.assets = assets || [];
    }

    load(loader: AssetLoader, assetPath?: string): Promise<THREE.Object3D>
    {
        const modelAsset = this.findAsset("model");

        if (modelAsset) {
            return loader.loadModel(modelAsset, assetPath);
        }

        const geoAsset = this.findAsset("geometry");

        if (geoAsset) {
            return loader.loadGeometry(geoAsset, assetPath)
                .then(geometry => {
                    const imageAssets = this.findAssets("image");
                    return Promise.all(imageAssets.map(asset => loader.loadTexture(asset)))
                    .then(textures => {
                        const material = new UberMaterial();
                        this.assignTextures(imageAssets, textures, material);
                        return new THREE.Mesh(geometry, material);
                    });
                });
        }
    }

    protected findAsset(type: AssetType): IAsset | undefined
    {
        return this.assets.find(asset => asset.type === type);
    }

    protected findAssets(type: AssetType): IAsset[]
    {
        return this.assets.filter(asset => asset.type === type);
    }

    protected assignTextures(assets: IAsset[], textures: THREE.Texture[], material: UberMaterial)
    {
        for (let i = 0; i < assets.length; ++i) {
            const asset = assets[i];
            const texture = textures[i];

            switch(asset.mapType) {
                case "color":
                    material.map = texture;
                    break;
                case "occlusion":
                    material.aoMap = texture;
                    break;
                case "emissive":
                    material.emissiveMap = texture;
                    break;
                case "metallic-roughness":
                    material.metalnessMap = texture;
                    material.roughnessMap = texture;
                    break;
                case "normal":
                    material.normalMap = texture;
                    break;
            }
        }
    }
}
