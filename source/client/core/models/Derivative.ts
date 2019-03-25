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

import Document, { IDocumentDisposeEvent, IDocumentUpdateEvent } from "@ff/core/Document";

import {
    IDerivative as IDerivativeJSON,
    EDerivativeQuality,
    TDerivativeQuality,
    EDerivativeUsage,
    TDerivativeUsage, TAssetType
} from "common/types/model";

import UberPBRMaterial from "../shaders/UberPBRMaterial";
import CVAssetLoader from "../../explorer/components/CVAssetLoader";

import Asset, { EAssetType, EMapType } from "./Asset";

////////////////////////////////////////////////////////////////////////////////

export { EDerivativeQuality, EDerivativeUsage, Asset, EAssetType };

export type IDerivativeUpdateEvent = IDocumentUpdateEvent<Derivative>;
export type IDerivativeDisposeEvent = IDocumentDisposeEvent<Derivative>;

// @ts-ignore: change property type from string to enum
export interface IDerivative extends IDerivativeJSON
{
    usage: EDerivativeUsage;
    quality: EDerivativeQuality;
    assets: Asset[];
}

export default class Derivative extends Document<IDerivative, IDerivativeJSON>
{
    static fromJSON(json: IDerivativeJSON)
    {
        return new Derivative(json);
    }

    model: THREE.Object3D = null;

    dispose()
    {
        if (this.model) {
            disposeObject(this.model);
        }

        super.dispose();
    }

    load(loaders: CVAssetLoader, baseUrl: string): Promise<THREE.Object3D>
    {
        if (this.data.usage !== EDerivativeUsage.Web3D) {
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

    createAsset(assetType: EAssetType, uri: string): Asset
    {
        if (!uri) {
            throw new Error("uri must be specified");
        }

        const type = EAssetType[assetType] as TAssetType;
        const asset = new Asset({ type, uri });
        this.data.assets.push(asset);
        return asset;
    }

    findAsset(type: EAssetType): Asset | undefined
    {
        return this.data.assets.find(asset => asset.data.type === type);
    }

    findAssets(type: EAssetType): Asset[]
    {
        return this.data.assets.filter(asset => asset.data.type === type);
    }

    toString(verbose: boolean = false)
    {
        const data = this.data;

        if (verbose) {
            return `Derivative - usage: '${EDerivativeUsage[data.usage]}', quality: '${EDerivativeQuality[data.quality]}'\n   `
                + data.assets.map(asset => asset.toString()).join("\n   ");
        }
        else {
            return `Derivative - usage: '${EDerivativeUsage[data.usage]}', quality: '${EDerivativeQuality[data.quality]}', #assets: ${data.assets.length})`;
        }
    }

    protected init()
    {
        return {
            usage: EDerivativeUsage.Web3D,
            quality: EDerivativeQuality.Medium,
            assets: [],
        };
    }

    protected deflate(data: IDerivative, json: IDerivativeJSON)
    {
        json.usage = EDerivativeUsage[data.usage] as TDerivativeUsage;
        json.quality = EDerivativeQuality[data.quality] as TDerivativeQuality;
        json.assets = data.assets.map(asset => asset.toJSON());
    }

    protected inflate(json: IDerivativeJSON, data: IDerivative)
    {
        data.usage = EDerivativeUsage[json.usage];
        if (data.usage === undefined) {
            throw new Error(`unknown derivative usage: ${json.usage}`);
        }

        data.quality = EDerivativeQuality[json.quality];
        if (data.quality === undefined) {
            throw new Error(`unknown derivative quality: ${json.quality}`);
        }

        data.assets = json.assets.map(assetJson => new Asset(assetJson));
    }

    protected assignTextures(assets: Asset[], textures: THREE.Texture[], material: UberPBRMaterial)
    {
        for (let i = 0; i < assets.length; ++i) {
            const asset = assets[i];
            const texture = textures[i];

            switch(asset.data.mapType) {
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
}
