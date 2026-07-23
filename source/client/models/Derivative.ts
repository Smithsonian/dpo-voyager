/**
 * 3D Foundation Project
 * Copyright 2025 Smithsonian Institution
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

import { Object3D, Mesh, Texture, MeshStandardMaterial, Vector3, Material } from "three";

import { disposeObject } from "@ff/three/helpers";

import Document, { IDocumentDisposeEvent, IDocumentUpdateEvent } from "@ff/core/Document";

import {
    IDerivative as IDerivativeJSON,
    EDerivativeQuality,
    TDerivativeQuality,
    EDerivativeUsage,
    TDerivativeUsage,
} from "client/schema/model";

import CVAssetReader from "../components/CVAssetReader";

import Asset, { EAssetType, EMapType } from "./Asset";
import { addCustomMaterialDefines, extendShaders, } from "client/shaders/ShaderExtension";

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

    model: Object3D = null;

    abortControl :AbortController = null;

    constructor(json?: IDerivativeJSON){
        super(json);
        this.addEvent("load");
    }

    dispose()
    {
        this.unload();
        super.dispose();
    }

    load(assetReader: CVAssetReader): Promise<Object3D>
    {
        if (this.data.usage !== EDerivativeUsage.Web3D) {
            throw new Error("can't load, not a Web3D derivative");
        }

        if(this.abortControl){
            ENV_DEVELOPMENT && console.warn("Aborting inflight derivative load");
            this.abortControl.abort(new Error("Derivative load cancelled")); //This should not happen, but if in doubt, cancel duplicates
        }
        this.abortControl = new AbortController();
        const modelAsset = this.findAsset(EAssetType.Model);

        if (modelAsset) {
            return assetReader.getModel(modelAsset.data.uri, {signal: this.abortControl.signal})
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
            return assetReader.getGeometry(geoAsset.data.uri)
            .then(geometry => {
                this.model = new Mesh(geometry, new MeshStandardMaterial());
                this.model.castShadow = true;

                return Promise.all(imageAssets.map(asset => assetReader.getTexture(asset.data.uri)))
                .catch(error => {
                    console.warn("failed to load texture files");
                    return [];
                });
            })
            .then(textures => {
                const material = (this.model as Mesh).material as MeshStandardMaterial;
                this.assignTextures(imageAssets, textures, material);

                // update default shaders for extended functionality
                extendShaders(material);
                material.userData.paramCopy = {};

                // add defines for shader customization
                addCustomMaterialDefines(material);

                if (!material.map) {
                    material.color.setScalar(0.5);
                    material.roughness = 0.8;
                    material.metalness = 0;
                }

                return this.model;
            });
        }
    }

    unload()
    {
        this.abortControl?.abort();
        if (this.model) {
            // handle disposing variants
            if(this.model.userData["variants"]) {
                const materials = this.model.userData["variants"].variantMaterials;
                for (let key_a in materials) {
                    const material = materials[key_a] as Material;
                    if (material) {
                        for (let key_b in material) {
                            const texture = material[key_b] as Texture;
                            if (texture && texture.isTexture) {
                                texture.dispose();
                            }
                        }
                        material.dispose();
                    }
                };
                this.model.userData["variants"].variantMaterials = null;
            }

            disposeObject(this.model);
            this.model = null;
        }
    }

    createAsset(type: EAssetType, uri: string)
    {
        const asset = new Asset();
        asset.data.type = type;
        asset.data.uri = uri;

        this.addAsset(asset);
        return asset;
    }

    addAsset(asset: Asset)
    {
        if (!asset.data.uri) {
            throw new Error("uri must be specified");
        }

        this.data.assets.push(asset);
        this.update();
    }

    removeAsset(asset: Asset)
    {
        const index = this.data.assets.indexOf(asset);
        if (index >= 0) {
            this.data.assets.splice(index, 1);
        }
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

    protected assignTextures(assets: Asset[], textures: Texture[], material: MeshStandardMaterial)
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
