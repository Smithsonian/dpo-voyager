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

import resolvePathname from "resolve-pathname";

import CController, { Commander, Actions } from "@ff/graph/components/CController";

/////////////////////////////////////////////////////////////////////////////////

export type MiniActions = Actions<CMini>;

/**
 * Voyager Mini controller component. Manages presentation of items and assets.
 */
export default class CMini extends CController<CMini>
{
    static readonly typeName: string = "CMini";

    loadItem(itemUrl: string, templateUrl?: string)
    {
        // TODO: Implement
    }

    loadModel(modelUrl: string, quality?: string, itemUrl?: string, templateUrl?: string)
    {
        // TODO: Implement
    }

    loadGeometryAndTexture(geometryUrl: string, textureUrl?: string, quality?: string, itemUrl?: string, templateUrl?: string)
    {
        // TODO: Implement
    }

}