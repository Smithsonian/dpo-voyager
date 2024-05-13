/**
 * 3D Foundation Project
 * Copyright 2024 Smithsonian Institution
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

import Node from "@ff/graph/Node";

import CPulse from "@ff/graph/components/CPulse";
import CRenderer from "@ff/scene/components/CRenderer";
import CPickSelection from "@ff/scene/components/CPickSelection";
import CFullscreen from "@ff/scene/components/CFullscreen";

import CVAssetManager from "../components/CVAssetManager";
import CVAssetReader from "../components/CVAssetReader";
import CVAnalytics from "../components/CVAnalytics";
import CVARManager from "../components/CVARManager";

////////////////////////////////////////////////////////////////////////////////

export default class NVEngine extends Node
{
    static readonly typeName: string = "NVEngine";

    get pulse() {
        return this.components.get(CPulse);
    }
    get renderer() {
        return this.components.get(CRenderer);
    }
    get fullscreen() {
        return this.components.get(CFullscreen);
    }
    get selection() {
        return this.components.get(CPickSelection);
    }
    get assetManager() {
        return this.components.get(CVAssetManager);
    }
    get assetReader() {
        return this.components.get(CVAssetReader);
    }
    get analytics() {
        return this.components.get(CVAnalytics);
    }
    get arManager() {
        return this.components.get(CVARManager);
    }

    createComponents()
    {
        this.createComponent(CPulse);
        this.createComponent(CRenderer);
        this.createComponent(CFullscreen);
        this.createComponent(CVAssetManager);
        this.createComponent(CVAssetReader);
        this.createComponent(CVAnalytics);
        this.createComponent(CVARManager);

        const selection = this.createComponent(CPickSelection);

        // allow simultaneous selection of nodes and components
        //selection.exclusiveSelect = false;
        // don't allow selecting multiple nodes or components
        //selection.multiSelect = false;
        // do not display selection brackets
        selection.ins.viewportBrackets.setValue(false);
    }
}