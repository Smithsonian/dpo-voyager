/**
 * FF Typescript Foundation Library
 * Copyright 2020 Ralph Wiedemeier, Frame Factory GmbH
 *
 * License: MIT
 */

import {
    LoadingManager as ThreeLoadingManager,
} from "three";

////////////////////////////////////////////////////////////////////////////////


export default class LoadingManager extends ThreeLoadingManager
{
    constructor()
    {
        super();

        this.onStart = this.onLoadingStart.bind(this);
        this.onProgress = this.onLoadingProgress.bind(this);
        this.onLoad = this.onLoadingCompleted.bind(this);
        this.onError = this.onLoadingError.bind(this);
    }

    protected onLoadingStart()
    {
        if (ENV_DEVELOPMENT) {
            console.debug("Loading files...");
        }
    }

    protected onLoadingProgress(url, itemsLoaded, itemsTotal)
    {
        if (ENV_DEVELOPMENT) {
            console.debug(`Loaded ${itemsLoaded} of ${itemsTotal} files: ${url}`);
        }
    }

    protected onLoadingCompleted()
    {
        if (ENV_DEVELOPMENT) {
            console.debug("Loading completed");
        }
    }

    protected onLoadingError()
    {
        if (ENV_DEVELOPMENT) {
            console.error(`Loading error`);
        }
    }
}