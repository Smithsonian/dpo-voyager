/**
 * 3D Foundation Project
 * Copyright 2019 Smithsonian Institution
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

import fetch from "@ff/browser/fetch";
import Component, { Node, types } from "@ff/graph/Component";

import JSONReader from "../io/JSONReader";
import ModelReader from "../io/ModelReader";
import GeometryReader from "../io/GeometryReader";
import TextureReader from "../io/TextureReader";

////////////////////////////////////////////////////////////////////////////////

const _VERBOSE = true;

export interface IAssetService
{
    setBusy: (isBusy: boolean) => void;
}

export default class CVAssetReader extends Component implements IAssetService
{
    static readonly typeName: string = "CVAssetReader";

    protected static readonly ins = {
        setBusy: types.Boolean("Reader.SetBusy"),
    };

    protected static readonly outs = {
        busy: types.Boolean("Reader.IsBusy"),
        //initialCompleted: types.Event("Reader.InitialCompleted"),
        completed: types.Event("Reader.Completed"),
    };

    ins = this.addInputs(CVAssetReader.ins);
    outs = this.addOutputs(CVAssetReader.outs);

    readonly jsonLoader: JSONReader;
    readonly modelLoader: ModelReader;
    readonly geometryLoader: GeometryReader;
    readonly textureLoader: TextureReader;

    private _loadingManager: AssetLoadingManager;
    private _rootUrl: string;
    private _rootPath: string;
    private _isBusy = false;


    constructor(node: Node, id: string)
    {
        super(node, id);

        const loadingManager = this._loadingManager = new AssetLoadingManager(this);

        this.jsonLoader = new JSONReader(loadingManager);
        this.modelLoader = new ModelReader(loadingManager);
        this.geometryLoader = new GeometryReader(loadingManager);
        this.textureLoader = new TextureReader(loadingManager);

        this.rootUrl = window.location.href;
    }

    get rootUrl() {
        return this._rootUrl;
    }
    set rootUrl(url: string) {
        const urlObj = new URL(".", new URL(url, window.location as any).href);
        this._rootUrl = urlObj.href;
        this._rootPath = urlObj.pathname;
        console.log("CVAssetReader - rootUrl: %s, rootPath: %s", this._rootUrl, this._rootPath);
    }

    update(context)
    {
        const ins = this.ins;

        if (ins.setBusy.changed) {
            this.outs.busy.setValue(ins.setBusy.value || this._isBusy);
        }

        return true;
    }

    setBusy(isBusy: boolean)
    {
        const outs = this.outs;

        this._isBusy = isBusy;
        outs.busy.setValue(this.ins.setBusy.value || this._isBusy);

        if (!isBusy) {
            outs.completed.set();
        }
    }

    getAssetName(pathOrUrl: string)
    {
        return pathOrUrl.split("/").pop();
    }

    getAssetPath(url: string)
    {
        const index = url.indexOf(this._rootPath);
        if (index >= 0) {
            return url.substr(index + this._rootPath.length);
        }

        return url;
    }

    getAssetURL(assetPath: string)
    {
        return new URL(assetPath, this._rootUrl).href;
    }

    getJSON(assetPath: string): Promise<any>
    {
        const url = this.getAssetURL(assetPath);
        return this.jsonLoader.get(url);
    }

    getText(assetPath: string): Promise<string>
    {
        const url = this.getAssetURL(assetPath);
        return fetch.text(url, "GET");
    }

    getModel(assetPath: string): Promise<THREE.Object3D>
    {
        const url = this.getAssetURL(assetPath);
        return this.modelLoader.get(url);
    }

    getGeometry(assetPath: string): Promise<THREE.Geometry>
    {
        const url = this.getAssetURL(assetPath);
        return this.geometryLoader.get(url);
    }

    getTexture(assetPath: string): Promise<THREE.Texture>
    {
        const url = this.getAssetURL(assetPath);
        return this.textureLoader.get(url);
    }
}

////////////////////////////////////////////////////////////////////////////////

export class AssetLoadingManager extends THREE.LoadingManager
{
    protected assetService: IAssetService;

    constructor(assetService: IAssetService)
    {
        super();
        this.assetService = assetService;

        this.onStart = this.onLoadingStart.bind(this);
        this.onProgress = this.onLoadingProgress.bind(this);
        this.onLoad = this.onLoadingCompleted.bind(this);
        this.onError = this.onLoadingError.bind(this);
    }

    protected onLoadingStart()
    {
        if (_VERBOSE) {
            console.log("Loading files...");
        }

        this.assetService.setBusy(true);
    }

    protected onLoadingProgress(url, itemsLoaded, itemsTotal)
    {
        if (_VERBOSE) {
            console.log(`Loaded ${itemsLoaded} of ${itemsTotal} files: ${url}`);
        }
    }

    protected onLoadingCompleted()
    {
        if (_VERBOSE) {
            console.log("Loading completed");
        }

        this.assetService.setBusy(false);
    }

    protected onLoadingError()
    {
        if (_VERBOSE) {
            console.error(`Loading error`);
        }

        this.assetService.setBusy(false);
    }
}