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

import { TextureLoader, LoadingManager, Texture } from "three";

////////////////////////////////////////////////////////////////////////////////

export default class TextureReader
{
    static readonly extensions = [ "jpg", "png" ];
    static readonly mimeTypes = [ "image/jpeg", "image/png" ];

    protected textureLoader: TextureLoader;


    constructor(loadingManager: LoadingManager)
    {
        this.textureLoader = new TextureLoader(loadingManager);
    }

    isValid(url: string): boolean
    {
        const extension = url.split(".").pop().toLowerCase();
        return TextureReader.extensions.indexOf(extension) >= 0;
    }

    isValidMimeType(mimeType: string): boolean
    {
        return TextureReader.mimeTypes.indexOf(mimeType) >= 0;
    }

    get(url: string): Promise<Texture>
    {
        return new Promise((resolve, reject) => {
            this.textureLoader.load(url, texture => {
                resolve(texture);
            }, null, errorEvent => {
                console.error(errorEvent);
                reject(new Error((errorEvent as any).message));
            });
        });
    }

    getImmediate(url: string): Texture
    {
        return this.textureLoader.load(url, null, null, errorEvent => {
            console.error(errorEvent);
        });
    }
}