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

import { IPresentation } from "common/types/presentation";
import PresentationValidator from "./PresentationValidator";

////////////////////////////////////////////////////////////////////////////////

export default class PresentationLoader
{
    private _loadingManager: THREE.LoadingManager;
    private _validator: PresentationValidator;

    constructor(loadingManager: THREE.LoadingManager)
    {
        this._loadingManager = loadingManager;
        this._validator = new PresentationValidator();
    }

    load(url: string): Promise<IPresentation>
    {
        this._loadingManager.itemStart(url);

        return fetch(url, {
            headers: {
                "Accept": "application/json"
            }
        }).then(result => {
            if (!result.ok) {
                this._loadingManager.itemError(url);
                throw new Error(`failed to fetch presentation '${url}', status: ${result.status} ${result.statusText}`)
            }

            return result.json();
        }).then(json => {
            if (!this._validator.validatePresentation(json)) {
                this._loadingManager.itemError(url);
                throw new Error(`failed to validate presentation '${url}'`);
            }

            this._loadingManager.itemEnd(url);
            return json;
        });
    }
}