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

import { disposeObject } from "@ff/three/helpers";

import { IDerivative, TDerivativeQuality, TDerivativeUsage } from "common/types/item";

import CVLoaders from "../components/CVLoaders";
import UberPBRMaterial from "../shaders/UberPBRMaterial";

import Asset, { EAssetType, EMapType } from "./Asset";

////////////////////////////////////////////////////////////////////////////////

export { Asset, EAssetType };

export enum EDerivativeUsage { Web, Print, Editorial }
export enum EDerivativeQuality { Thumb, Low, Medium, High, Highest, LOD, Stream }

export default class Derivative
{
    id: string;
    usage: EDerivativeUsage;
    quality: EDerivativeQuality;
    assets: Asset[];

    model: THREE.Object3D;

    constructor(usage: EDerivativeUsage, quality: EDerivativeQuality);
    constructor(data: IDerivative);
    constructor(usageOrData, quality?)
    {
        this.id = "";

        if (quality === undefined) {
            this.fromData(usageOrData);
        }
        else {
            this.usage = usageOrData;
            this.quality = quality;
            this.assets = [];
        }

        this.model = null;
    }

    dispose()
    {
        if (this.model) {
            disposeObject(this.model);
        }
    }

    load(loadingManager: CVLoaders, assetPath?: string): Promise<this>
    {
        console.log("Derivative.load - path: %s", assetPath);

        const modelAsset = this.findAsset(EAssetType.Model);

        if (modelAsset) {
            return loadingManager.loadModel(modelAsset, assetPath)
            .then(object => {
                if (this.model) {
                    disposeObject(this.model);
                }
                this.model = object;
                return this;
            });
        }

        const geoAsset = this.findAsset(EAssetType.Geometry);
        const imageAssets = this.findAssets(EAssetType.Image);

        if (geoAsset) {
            return loadingManager.loadGeometry(geoAsset, assetPath)
            .then(geometry => {
                this.model = new THREE.Mesh(geometry, new UberPBRMaterial());

                return Promise.all(imageAssets.map(asset => loadingManager.loadTexture(asset, assetPath)))
                .catch(error => {
                    console.warn("failed to load texture files");
                    return [];
                });
            })
            .then(textures => {
                const material = (this.model as THREE.Mesh).material as UberPBRMaterial;
                this.assignTextures(imageAssets, textures, material);

                if (!material.map) {
                    material.color.setScalar(0.5);
                    material.roughness = 0.8;
                    material.metalness = 0;
                }

                return this;
            });
        }
    }

    createAsset(type: EAssetType, uri: string): Asset
    {
        if (!uri) {
            throw new Error("uri must be specified");
        }

        const asset = new Asset(type, uri);
        this.assets.push(asset);
        return asset;
    }

    fromData(data: IDerivative)
    {
        this.usage = EDerivativeUsage[data.usage];
        this.quality = EDerivativeQuality[data.quality];
        this.assets = data.assets.map(assetData => new Asset(assetData));
    }

    toData(): IDerivative
    {
        return {
            usage: EDerivativeUsage[this.usage] as TDerivativeUsage,
            quality: EDerivativeQuality[this.quality] as TDerivativeQuality,
            assets: this.assets.map(asset => asset.toData())
        };
    }

    toString()
    {
        return `Derivative - usage: ${EDerivativeUsage[this.usage]}, quality: ${EDerivativeQuality[this.quality]}, #assets: ${this.assets.length})`;
    }

    findAsset(type: EAssetType): Asset | undefined
    {
        return this.assets.find(asset => asset.type === type);
    }

    findAssets(type: EAssetType): Asset[]
    {
        return this.assets.filter(asset => asset.type === type);
    }

    protected assignTextures(assets: Asset[], textures: THREE.Texture[], material: UberPBRMaterial)
    {
        for (let i = 0; i < assets.length; ++i) {
            const asset = assets[i];
            const texture = textures[i];

            switch(asset.mapType) {
                case EMapType.Color:
                    material.map = texture;
                    break;

                case EMapType.Occlusion:
                    material.aoMap = texture;
                    break;

                case EMapType.Emissive:
                    material.emissiveMap = texture;
                    break;

                case EMapType.MetallicRoughness:
                    material.metalnessMap = texture;
                    material.roughnessMap = texture;
                    break;

                case EMapType.Normal:
                    material.normalMap = texture;
                    break;
            }
        }
    }

    protected disposeMesh(mesh: THREE.Mesh)
    {
        mesh.geometry.dispose();
        const material: any = mesh.material;

        if (material.map) {
            material.map.dispose();
        }
        if (material.aoMap) {
            material.aoMap.dispose();
        }
        if (material.emissiveMap) {
            material.emissiveMap.dispose();
        }
        if (material.metalnessMap) {
            material.metalnessMap.dispose();
        }
        if (material.roughnessMap) {
            material.roughnessMap.dispose();
        }
        if (material.normalMap) {
            material.normalMap.dispose();
        }
    }
}
