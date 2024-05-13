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

import { Object3D, Mesh, Texture } from "three";

import { disposeObject } from "@ff/three/helpers";

import Document, { IDocumentDisposeEvent, IDocumentUpdateEvent } from "@ff/core/Document";

import {
    IDerivative as IDerivativeJSON,
    EDerivativeQuality,
    TDerivativeQuality,
    EDerivativeUsage,
    TDerivativeUsage,
} from "client/schema/model";

import UberPBRMaterial from "../shaders/UberPBRMaterial";
import CVAssetReader from "../components/CVAssetReader";

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

interface Cached<T>{
    ref: number;
    asset: Promise<T>;
}

class ObjectCache<T extends object>{
    #rlookup = new WeakMap<T, string>();
    #refs = new Map<string,Cached<T>>();

    #gc(id :string, destructor :(asset :T)=>void) :boolean{
        const cached = this.#refs.get(id);
        if(!cached) return false;
        if(cached.ref == 0){
            cached.asset.then((a)=>{
                console.debug("Dispose of ", id)
                destructor(a);
            });
            this.#refs.delete(id);
            return true;
        }else{
            console.debug("Abort GC for %s", id);
        }
        return false;
    }

    ref(id :string, getter:()=>Promise<T>) :Promise<T> {
        let cached = this.#refs.get(id);
        if(cached) {
            cached.ref++;
            console.debug("referencing cached asset %s : %d ", id, cached.ref);
            return cached.asset;
        }
        console.debug("Fetch object %s", id);
        const asset = getter().then((a)=>{
            this.#rlookup.set(a, id);
            return a;
        });
        this.#refs.set(id, {ref: 1, asset});
        return asset;
    }

    unref(asset :T, destructor:(asset :T)=>void) :void{

        const id = this.#rlookup.get(asset);
        if(!id) return console.warn("Failed to unref unknown asset");

        const cached = this.#refs.get(id);
        if(!cached) return console.warn("Can't unref asset id %s", id);
        //Ensure actual unref is delayed until the next tick
        if( --cached.ref == 0){
            //GC is delayed because we don't want to race for some asset being removed from the scene then added just after
            //Like what  `CVDocument.openDocument()` do.
            setTimeout(()=>{
                if(this.#gc(id, destructor)){
                    this.#rlookup.delete(asset);
                }
            }, 500);
        }else{
            console.debug("Ref count for %s : %d ", id, cached.ref);
        }
    }

    cached(id :string) :boolean{
        return this.#refs.has(id);
    }
}

export default class Derivative extends Document<IDerivative, IDerivativeJSON>
{
    static _cache = new ObjectCache<Object3D>();
    static fromJSON(json: IDerivativeJSON)
    {
        return new Derivative(json);
    }

    model: Object3D = null;

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

        const modelAsset = this.findAsset(EAssetType.Model);

        if (modelAsset) {
            return Derivative._cache.ref(modelAsset.data.uri, ()=>assetReader.getModel(modelAsset.data.uri))
            .then(object => {
                if (this.model) {
                    Derivative._cache.unref(this.model, (model)=>disposeObject(model));
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
                this.model = new Mesh(geometry, new UberPBRMaterial());

                return Promise.all(imageAssets.map(asset => assetReader.getTexture(asset.data.uri)))
                .catch(error => {
                    console.warn("failed to load texture files");
                    return [];
                });
            })
            .then(textures => {
                const material = (this.model as Mesh).material as UberPBRMaterial;
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

    unload()
    {
        if (this.model) {
            Derivative._cache.unref(this.model, (model)=>disposeObject(model));
            this.model = null;
        }
    }

    isCached() :boolean{
        const modelAsset = this.findAsset(EAssetType.Model);
        return modelAsset ? Derivative._cache.cached(modelAsset.data.uri) : false;
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

    protected assignTextures(assets: Asset[], textures: Texture[], material: UberPBRMaterial)
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
