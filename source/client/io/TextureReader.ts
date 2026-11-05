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

import { TextureLoader, LoadingManager, Texture } from "three";
import { HDRLoader } from "three/examples/jsm/loaders/HDRLoader";

////////////////////////////////////////////////////////////////////////////////

export default class TextureReader
{
    static readonly extensions = [ "jpg", "png" ];
    static readonly mimeTypes = [ "image/jpeg", "image/png" ];

    protected textureLoader: TextureLoader;
    protected hdriLoader: HDRLoader;


    constructor(loadingManager: LoadingManager)
    {
        this.textureLoader = new TextureLoader(loadingManager);
        this.hdriLoader = new HDRLoader(loadingManager);
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

    /**
     * Loads a texture. Three's loaders can't cancel a single request: once the signal aborts,
     * this rejects with its reason, and the texture is disposed of if it arrives anyway.
     */
    get(url: string, assetPath: string, {signal}:{signal?:AbortSignal}={}): Promise<Texture>
    {
        return new Promise((resolve, reject) => {
            if (signal?.aborted) {
                return reject(signal.reason);
            }
            const onAbort = () => reject(signal.reason);
            signal?.addEventListener("abort", onAbort, { once: true });

            const onLoad = (texture: Texture) => {
                signal?.removeEventListener("abort", onAbort);
                if (signal?.aborted) {
                    return texture.dispose();
                }
                resolve(texture);
            };
            const onError = errorEvent => {
                signal?.removeEventListener("abort", onAbort);
                console.error(errorEvent);
                // an image element's error event tells nothing more
                reject(new Error((errorEvent as any).message || `Failed to load the texture at '${url}'`));
            };

            if(assetPath.endsWith(".hdr")) {
                this.hdriLoader.load(url, onLoad, null, onError);
            }
            else {
                this.textureLoader.load(url, onLoad, null, onError);
            }
        });
    }

    getImmediate(url: string): Texture
    {
        return this.textureLoader.load(url, null, null, errorEvent => {
            console.error(errorEvent);
        });
    }
}