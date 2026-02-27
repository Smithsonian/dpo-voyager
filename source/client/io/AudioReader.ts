/**
 * 3D Foundation Project
 * Copyright 2026 Smithsonian Institution
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

////////////////////////////////////////////////////////////////////////////////

export default class AudioReader
{
    protected loadingManager: LoadingManager;

    constructor(loadingManager: LoadingManager)
    {
        this.loadingManager = loadingManager;
    }

    get(url: string): Promise<ArrayBuffer>
    {
        return new Promise((resolve, reject) => {
            const request = new XMLHttpRequest();
            request.open('GET', url, true);
            request.responseType = 'arraybuffer';
            request.onload = () => {
                if (request.status >= 200 && request.status < 300) {
                    this.loadingManager.itemEnd(url)
                    resolve(request.response); 
                } else {
                    this.loadingManager.itemError(url);
                    reject(Error(request.statusText));
                }
            };
            request.onerror = () => {
                this.loadingManager.itemError(url);
                reject(Error("Possible network error"));
            };
            request.send();
            this.loadingManager.itemStart(url);
        });
    }
}