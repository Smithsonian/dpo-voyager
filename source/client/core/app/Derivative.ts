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
    TAssetType
} from "common/types/item";

import AssetLoader from "../loaders/AssetLoader";
import UberMaterial from "../shaders/UberMaterial";

import Asset, { EAssetType } from "./Asset";

////////////////////////////////////////////////////////////////////////////////

export { Asset, EAssetType };

export enum EDerivativeUsage { Web, Print, Editorial }
export enum EDerivativeQuality { Thumb, Low, Medium, High, Highest, LOD, Stream }

export default class Derivative
{
    id: string;
    usage: EDerivativeUsage;
    quality: EDerivativeQuality;
    assets: IAsset[];

    constructor(usage: EDerivativeUsage, quality: EDerivativeQuality, assets?: IAsset[])
    {
        this.id = "";
        this.usage = usage;
        this.quality = quality;
        this.assets = assets || [];
    }

    load(loader: AssetLoader, assetPath?: string): Promise<THREE.Object3D>
    {
        const modelAsset = this.findAsset(EAssetType.Model);

        if (modelAsset) {
            return loader.loadModel(modelAsset, assetPath);
        }

        const geoAsset = this.findAsset(EAssetType.Geometry);

        if (geoAsset) {
            return loader.loadGeometry(geoAsset, assetPath)
                .then(geometry => {
                    const imageAssets = this.findAssets(EAssetType.Image);
                    return Promise.all(imageAssets.map(asset => loader.loadTexture(asset)))
                    .then(textures => {
                        const material = new UberMaterial();
                        this.assignTextures(imageAssets, textures, material);
                        return new THREE.Mesh(geometry, material);
                    });
                });
        }
    }

    addAsset(uri: string, type: EAssetType)
    {
        const t = EAssetType[type] as TAssetType;
        this.assets.push({ uri, type: t });
    }

    protected findAsset(type: EAssetType): IAsset | undefined
    {
        const t = EAssetType[type] as TAssetType;
        return this.assets.find(asset => asset.type === t);
    }

    protected findAssets(type: EAssetType): IAsset[]
    {
        const t = EAssetType[type] as TAssetType;
        return this.assets.filter(asset => asset.type === t);
    }

    protected assignTextures(assets: IAsset[], textures: THREE.Texture[], material: UberMaterial)
    {
        for (let i = 0; i < assets.length; ++i) {
            const asset = assets[i];
            const texture = textures[i];

            switch(asset.mapType) {
                case "Color":
                    material.map = texture;
                    break;
                case "Occlusion":
                    material.aoMap = texture;
                    break;
                case "Emissive":
                    material.emissiveMap = texture;
                    break;
                case "MetallicRoughness":
                    material.metalnessMap = texture;
                    material.roughnessMap = texture;
                    break;
                case "Normal":
                    material.normalMap = texture;
                    break;
            }
        }
    }
}
