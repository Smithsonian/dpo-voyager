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

import NTransform from "@ff/scene/nodes/NTransform";

import CVNavigation from "../../core/components/CVNavigation";
import CVOrbitNavigation from "../../core/components/CVOrbitNavigation";

import CVFeatures from "../components/CVFeatures";
import CVBackground from "../components/CVBackground";
import CVFloor from "../components/CVFloor";
import CVGrid from "../components/CVGrid";
import CVTape from "../components/CVTape";


////////////////////////////////////////////////////////////////////////////////

export default class NVFeatures extends NTransform
{
    static readonly typeName: string = "NVFeatures";

    get features() {
        return this.getComponent(CVFeatures);
    }
    get navigation() {
        return this.getComponent(CVNavigation);
    }
    get background() {
        return this.getComponent(CVBackground);
    }
    get floor() {
        return this.getComponent(CVFloor);
    }
    get grid() {
        return this.getComponent(CVGrid);
    }
    get tape() {
        return this.getComponent(CVTape);
    }

    createComponents()
    {
        super.createComponents();

        this.createComponent(CVFeatures);
        this.createComponent(CVOrbitNavigation);
        this.createComponent(CVBackground);
        this.createComponent(CVFloor);
        this.createComponent(CVGrid);
        this.createComponent(CVTape);
    }
}