/**
 * FF Typescript Foundation Library
 * Copyright 2019 Ralph Wiedemeier, Frame Factory GmbH
 *
 * License: MIT
 */

import { LoadingManager } from "three";

import Component, { Node, ITypedEvent } from "@ff/graph/Component";
import Loader from "@ff/three/loaders/Loader";

////////////////////////////////////////////////////////////////////////////////

export enum ELoadingState { Start, Progress, Completed, Error }

export interface IAssetLoadingEvent extends ITypedEvent<"loading">
{
    state: ELoadingState;
    url?: string;
    itemsLoaded?: number;
    itemsTotal?: number;
}

export default class CAssetLoader extends Component
{
    static readonly typeName: string = "CAssetLoader";

    readonly loadingManager: LoadingManager;

    private _loaders = new Map<string, Loader>();
    private _rootUrl: string;
    private _rootPath: string;


    constructor(node: Node, id: string)
    {
        super(node, id);

        const loadingManager = this.loadingManager = new LoadingManager();

        loadingManager.onStart = (url, itemsLoaded, itemsTotal) => {
            this.emit<IAssetLoadingEvent>({ type: "loading", state: ELoadingState.Start, url, itemsLoaded, itemsTotal });
        };

        loadingManager.onProgress = (url, itemsLoaded, itemsTotal) => {
            this.emit<IAssetLoadingEvent>({ type: "loading", state: ELoadingState.Progress, url, itemsLoaded, itemsTotal });
        };

        loadingManager.onLoad = () => {
            this.emit<IAssetLoadingEvent>({ type: "loading", state: ELoadingState.Completed });
        };

        loadingManager.onError = (url: string) => {
            this.emit<IAssetLoadingEvent>({ type: "loading", state: ELoadingState.Error, url });
        };
    }

    get rootUrl() {
        return this._rootUrl;
    }
    set rootUrl(url: string) {
        const urlObj = new URL(".", new URL(url, window.location as any).href);
        this._rootUrl = urlObj.href;
        this._rootPath = urlObj.pathname;

        if (ENV_DEVELOPMENT) {
            console.log("CVAssetReader - rootUrl: %s, rootPath: %s", this._rootUrl, this._rootPath);
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

    registerLoader(loaderType: typeof Loader)
    {
        if (this._loaders.has(loaderType.assetType)) {
            throw new Error(`loader for '${loaderType.assetType}' already registered`);
        }

        this._loaders.set(loaderType.assetType, new loaderType(this.loadingManager));
    }

    getLoader(assetType: string)
    {
        return this._loaders.get(assetType);
    }

    canLoad(path: string)
    {
        for (const loader of this._loaders.values()) {
            if (loader.canLoad(path)) {
                return true;
            }
        }

        return false;
    }

    findLoader(path: string): Loader | null
    {
        for (const loader of this._loaders.values()) {
            if (loader.canLoad(path)) {
                return loader;
            }
        }

        return null;
    }
}