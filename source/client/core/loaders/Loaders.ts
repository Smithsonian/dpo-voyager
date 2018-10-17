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

import { IPresentation, IItem } from "common/types/presentation";

import JSONLoader from "./JSONLoader";
import AssetLoader from "./AssetLoader";
import PresentationValidator from "./PresentationValidator";

////////////////////////////////////////////////////////////////////////////////

export default class Loaders
{
    readonly manager: THREE.LoadingManager;
    readonly jsonLoader: JSONLoader;
    readonly assetLoader: AssetLoader;
    readonly validator: PresentationValidator;

    constructor()
    {
        this.manager = new THREE.LoadingManager();
        this.jsonLoader = new JSONLoader(this.manager);
        this.assetLoader = new AssetLoader(this.manager);
        this.validator = new PresentationValidator();
    }

    loadPresentation(url: string): Promise<IPresentation>
    {
        return this.jsonLoader.load(url)
        .then(json => {
            if (!this.validator.validatePresentation(json)) {
                throw new Error(`failed to validate presentation '${url}'`);
            }

            return json;
        });
    }

    loadItem(url: string): Promise<IItem>
    {
        return this.jsonLoader.load(url)
        .then(json => {
            if (!this.validator.validateItem(json)) {
                throw new Error(`failed to validate item '${url}'`);
            }

            return json;
        });
    }
}