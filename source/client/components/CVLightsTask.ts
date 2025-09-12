/**
* Dynamic3D Project <https://research-software-directory.org/projects/dynamic3d>
* Copyright 2025 Netherlands eScience Center <https://www.esciencecenter.nl/>
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

import { IUpdateContext } from "@ff/graph/Component";
import CDirectionalLight from "@ff/scene/components/CDirectionalLight";
import { Property } from "@ff/scene/ui/PropertyField";
import { lightTypes } from "client/applications/coreTypes";
import NVNode from "client/nodes/NVNode";
import MainView from "client/ui/explorer/MainView";
import CreateLightMenu from "client/ui/story/CreateLightMenu";
import LightsTaskView from "client/ui/story/LightsTaskView";
import CVDocumentProvider from "./CVDocumentProvider";
import CVNode from "./CVNode";
import CVTask, { types } from "./CVTask";
import { CLight, ELightType, ICVLight } from "./lights/CVLight";

export default class CVLightsTask extends CVTask {
    static readonly typeName: string = "CVLightsTask";

    static readonly text: string = "Lights";
    static readonly icon: string = "bulb";

    protected static readonly ins = {
        delete: types.Event("Light.Delete"),
    };
    protected static readonly outs = {
    };

    ins = this.addInputs<CVTask, typeof CVLightsTask.ins>(CVLightsTask.ins);
    outs = this.addOutputs<CVTask, typeof CVLightsTask.outs>(CVLightsTask.outs);

    create(): void {
        super.create();
        this.startObserving();
    }

    dispose(): void {
        this.stopObserving();
        super.dispose();
    }

    createView() {
        return new LightsTaskView(this);
    }

    update(context: IUpdateContext) {
        const { ins } = this;

    // Light creation handled via Navigator (Plus button on Lights node). Remove create event handling here.

        const activeNode: NVNode | undefined = this.nodeProvider.activeNode;
    if (activeNode?.light) {
            if (ins.delete.changed) {
                activeNode.dispose();
                return true;
            }
        }
        return false;
    }

    // createLightNode moved to NodeTree (Navigator) for Plus button creation workflow

    protected static copyLightProperties(sourceNode: NVNode, targetNode: NVNode) {
        const sourceLight: CLight = sourceNode.light;
        const targetLight: CLight = targetNode.light;

        // Copy light properties
        (sourceLight as any).settingProperties
            .forEach((sourceProp: Property) => {
                targetLight.ins.properties
                    .find(targetProp => targetProp.key === sourceProp.key)
                    ?.setValue(sourceProp.value);
            }
            );

        // CDirectionalLight multiplies intensity by PI, so it needs to be compensated (divide by PI)
        if (sourceLight instanceof CDirectionalLight) {
            targetLight.ins.setValues({ "intensity": sourceLight.light.intensity / Math.PI });
        }

        // Copy transform properties
        (sourceLight.transform as CVNode).settingProperties
            .forEach((sourceProp: Property) => {
                targetNode.transform.ins.properties
                    .find(targetProp => targetProp.key === sourceProp.key)
                    ?.setValue(sourceProp.value);
            }
            );
    }
}