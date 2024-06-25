/**
 * FF Typescript Foundation Library
 * Copyright 2020 Ralph Wiedemeier, Frame Factory GmbH
 *
 * License: MIT
 */

import {
    TextureLoader as ThreeTextureLoader,
    LoadingManager,
    Texture,
} from "three";

import Loader from "./Loader";

////////////////////////////////////////////////////////////////////////////////

export default class TextureLoader extends Loader
{
    static readonly assetType = "texture";
    static readonly extensions = [ "jpg", "jpeg", "png" ];

    protected textureLoader: ThreeTextureLoader;

    constructor(loadingManager: LoadingManager)
    {
        super(loadingManager);

        this.textureLoader = new ThreeTextureLoader(loadingManager);
    }

    async load(url: string): Promise<Texture>
    {
        return new Promise((resolve, reject) => {
            this.textureLoader.load(url, texture => {
                resolve(texture);

            }, null, errorEvent => {
                console.error(errorEvent);
                reject(new Error(errorEvent.message));
            });
        });
    }
}