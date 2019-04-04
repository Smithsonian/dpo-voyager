/**
 * 3D Foundation Project
 * Copyright 2018 Smithsonian Institution
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

////////////////////////////////////////////////////////////////////////////////

export default class JSONWriter
{
    private _loadingManager: THREE.LoadingManager;

    constructor(loadingManager: THREE.LoadingManager)
    {
        this._loadingManager = loadingManager;
    }

    put(json: any, url: string): Promise<void>
    {
        this._loadingManager.itemStart(url);

        if (typeof json !== "string") {
            json = JSON.stringify(json);
        }

        const params: any = {
            headers: {
                "Content-Type": "application/json",
            },
            method: "PUT",
            credentials: "same-origin",
            body: json
        };

        return fetch(url, params).then(result => {
            if (!result.ok) {
                const message = `fetch PUT at '${url}', error: ${result.status} - ${result.statusText}`;
                console.warn(message);
                throw new Error(message);
            }
        });
    }
}