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

import {
    IDerivative,
    EDerivativeQuality,
    TDerivativeQuality,
    EDerivativeUsage,
    TDerivativeUsage
} from "common/types/model";

import UberPBRMaterial from "../shaders/UberPBRMaterial";
import CVAssetLoader from "../../explorer/components/CVAssetLoader";

import Asset, { EAssetType, EMapType } from "./Asset";

////////////////////////////////////////////////////////////////////////////////

export { IDerivative, EDerivativeQuality, EDerivativeUsage, Asset, EAssetType };


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

    load(loaders: CVAssetLoader, baseUrl: string): Promise<THREE.Object3D>
    {
        if (this.usage !== EDerivativeUsage.Web3D) {
            throw new Error("can't load, not a Web3D derivative");
        }

        const modelAsset = this.findAsset(EAssetType.Model);

        if (modelAsset) {
            return loaders.loadModelAsset(modelAsset, baseUrl)
            .then(object => {
                if (this.model) {
                    disposeObject(this.model);
                }
                this.model = object;
                return object;
            });
        }

        const geoAsset = this.findAsset(EAssetType.Geometry);
        const imageAssets = this.findAssets(EAssetType.Image);

        if (geoAsset) {
            return loaders.loadGeometryAsset(geoAsset, baseUrl)
            .then(geometry => {
                this.model = new THREE.Mesh(geometry, new UberPBRMaterial());

                return Promise.all(imageAssets.map(asset => loaders.loadTextureAsset(asset, baseUrl)))
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

                return this.model;
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
        if (this.usage === undefined) {
            throw new Error(`unknown derivative usage: ${data.usage}`);
        }

        this.quality = EDerivativeQuality[data.quality];
        if (this.quality === undefined) {
            throw new Error(`unknown derivative quality: ${data.quality}`);
        }

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

    toString(verbose: boolean = false)
    {
        if (verbose) {
            return `Derivative - usage: '${EDerivativeUsage[this.usage]}', quality: '${EDerivativeQuality[this.quality]}'\n   `
                + this.assets.map(asset => asset.toString()).join("\n   ");
        }
        else {
            return `Derivative - usage: '${EDerivativeUsage[this.usage]}', quality: '${EDerivativeQuality[this.quality]}', #assets: ${this.assets.length})`;
        }
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
