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

import clone from "@ff/core/clone";

import { IDerivative, IAsset, TAssetType, TDerivativeQuality, TDerivativeUsage, TMapType } from "common/types/item";

import AssetLoader from "../loaders/AssetLoader";
import UberMaterial from "../shaders/UberMaterial";

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
    assets: IAsset[];
    model: THREE.Object3D;
    boundingBox: THREE.Box3;

    constructor(usage: EDerivativeUsage, quality: EDerivativeQuality, assets?: IAsset[])
    {
        this.id = "";
        this.usage = usage;
        this.quality = quality;
        this.assets = assets || [];
        this.model = null;
        this.boundingBox = new THREE.Box3();
    }

    dispose()
    {
        if (this.model) {
            this.model.traverse((object: THREE.Mesh) => {
                if (object.isMesh) {
                    this.disposeMesh(object);
                }
            })
        }
    }

    load(loader: AssetLoader, assetPath?: string): Promise<this>
    {
        const modelAsset = this.findAsset(EAssetType.Model);

        if (modelAsset) {
            return loader.loadModel(modelAsset, assetPath)
                .then(object => {
                    this.model = object;
                    this.boundingBox.makeEmpty().expandByObject(object);
                    return this;
                });
        }

        const geoAsset = this.findAsset(EAssetType.Geometry);
        const imageAssets = this.findAssets(EAssetType.Image);

        if (geoAsset) {
            return loader.loadGeometry(geoAsset, assetPath)
                .then(geometry => {
                    this.model = new THREE.Mesh(geometry, new UberMaterial());
                    this.boundingBox.makeEmpty().expandByObject(this.model);

                    return Promise.all(imageAssets.map(asset => loader.loadTexture(asset, assetPath)))
                        .catch(error => {
                            console.warn("failed to load texture files");
                            return [];
                        });
                })
                .then(textures => {
                    const material = (this.model as THREE.Mesh).material as UberMaterial;
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

    addAsset(uri: string, type: EAssetType, mapType?: EMapType)
    {
        if (!uri) {
            throw new Error("uri must be specified");
        }

        const asset: Partial<IAsset> = {
            uri,
            type: EAssetType[type] as TAssetType
        };

        if (type === EAssetType.Image && mapType !== undefined) {
            asset.mapType = EMapType[mapType] as TMapType;
        }

        this.assets.push(asset as IAsset);
    }

    toData(): IDerivative
    {
        return {
            usage: EDerivativeUsage[this.usage] as TDerivativeUsage,
            quality: EDerivativeQuality[this.quality] as TDerivativeQuality,
            assets: clone(this.assets)
        };
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
                case EMapType[EMapType.Color]:
                    material.map = texture;
                    break;

                case EMapType[EMapType.Occlusion]:
                    material.aoMap = texture;
                    break;

                case EMapType[EMapType.Emissive]:
                    material.emissiveMap = texture;
                    break;

                case EMapType[EMapType.MetallicRoughness]:
                    material.metalnessMap = texture;
                    material.roughnessMap = texture;
                    break;

                case EMapType[EMapType.Normal]:
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
