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

import { LoadingManager } from "three";

import Component, { types } from "@ff/graph/Component";

////////////////////////////////////////////////////////////////////////////////

/**
 * Component containing a LoadingManager and services to convert
 * asset paths to URLs and vice versa.
 *
 * Outputs indicate whether the loading manager is busy.
 */
export default class CVAssetManager extends Component
{
    static readonly typeName: string = "CVAssetManager";

    static readonly text: string = "AssetManager";
    static readonly icon: string = "";

    static readonly isSystemSingleton = true;

    protected static readonly ins = {
        busy: types.Boolean("State.Busy"),
        //baseUrl: types.String("Settings.BaseURL"),
        baseUrlValid: types.Boolean("Settings.BaseURLValid")
    };

    protected static readonly outs = {
        busy: types.Boolean("State.Busy"),
        completed: types.Event("State.Completed"),
        //baseUrl: types.String("Settings.BaseURL"),
    };

    ins = this.addInputs(CVAssetManager.ins);
    outs = this.addOutputs(CVAssetManager.outs);

    private _loadingManager = new AssetLoadingManager(this);
    private _baseUrl: string = window.location.href;
    private _initialLoad: boolean = false;

    get loadingManager() {
        return this._loadingManager;
    }
    get baseUrl() {
        return this._baseUrl;
    }
    set baseUrl(url: string) {
        this._baseUrl = new URL(url, window.location.href).href;
    }
    get initialLoad() {
        return this._initialLoad;
    }
    set initialLoad(value: boolean) {
        this._initialLoad = value;
    }

    getAssetName(pathOrUrl: string)
    {
        return pathOrUrl.split("/").pop();
    }

    getAssetUrl(assetPath: string)
    {
        const url = new URL(assetPath, this._baseUrl).href;
        return this.loadingManager.resolveURL(url);
    }

    getAssetPath(url: string)
    {
        const baseUrl = this._baseUrl;

        const index = url.indexOf(baseUrl);
        if (index >= 0) {
            return url.substr(index + baseUrl.length);
        }

        return url;
    }

    getAssetBasePath(pathOrUrl: string)
    {
        const parts = this.getAssetPath(pathOrUrl).split("/");
        parts.pop();
        const basePath = parts.join("/");
        return basePath ? basePath + "/" : basePath;
    }

    getRelativeAssetPath(assetPathOrUrl: string, basePathOrUrl: string)
    {
        const assetUrl = this.getAssetUrl(assetPathOrUrl);
        const baseUrl = this.getAssetUrl(basePathOrUrl);

        const index = assetUrl.indexOf(baseUrl);
        if (index >= 0) {
            return assetUrl.substr(index + baseUrl.length);
        }

        return this.getAssetPath(assetUrl);
    }

    create()
    {
        super.create();
        //this.outs.baseUrl.setValue(window.location.href);
    }

    update()
    {
        const { ins, outs } = this;

        if (ins.busy.changed) {
            const isBusy = ins.busy.value || this._loadingManager.isBusy;
            outs.busy.setValue(isBusy);

            if (!isBusy) {
                outs.completed.set();
            }
        }

        // if (ins.baseUrl.changed) {
        //     try {
        //         outs.baseUrl.setValue(new URL(ins.baseUrl.value, window.location.href).href);
        //     }
        //     catch {
        //         outs.baseUrl.setValue(window.location.href);
        //     }
        // }

        return true;
    }


}

////////////////////////////////////////////////////////////////////////////////

class AssetLoadingManager extends LoadingManager
{
    private _manager: CVAssetManager;
    private _isBusy: boolean;

    get isBusy() {
        return this._isBusy;
    }

    constructor(manager: CVAssetManager)
    {
        super();

        this._manager = manager;
        this._isBusy = false;

        this.onStart = this.onLoadingStart.bind(this);
        this.onProgress = this.onLoadingProgress.bind(this);
        this.onLoad = this.onLoadingCompleted.bind(this);
        this.onError = this.onLoadingError.bind(this);
    }

    protected onLoadingStart()
    {
        if (ENV_DEVELOPMENT) {
            console.log("Loading files...");
        }

        // trigger update
        this._isBusy = true;
        this._manager.ins.busy.set();
    }

    protected onLoadingProgress(url, itemsLoaded, itemsTotal)
    {
        if (ENV_DEVELOPMENT) {
            console.log(`Loaded ${itemsLoaded} of ${itemsTotal} files: ${url}`);
        }
    }

    protected onLoadingCompleted()
    {
        if (ENV_DEVELOPMENT) {
            console.log("Loading completed");
        }

        // trigger update
        this._isBusy = false;
        this._manager.ins.busy.set();
    }

    protected onLoadingError()
    {
        if (ENV_DEVELOPMENT) {
            console.log(`Loading error`);
        }

        // trigger update
        //this._isBusy = false;
        //this._manager.ins.busy.set();
    }
}