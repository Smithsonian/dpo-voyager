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
        create: types.Event("Light.Create"),
        delete: types.Event("Light.Delete"),
        name: types.String("Light.Name", ""),
        type: types.Enum("Light.Type", ELightType, ELightType.directional),
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

        if (ins.create.changed) {
            const mainView: MainView = document.getElementsByTagName('voyager-story')[0] as MainView;
            const activeDoc = this.getMainComponent(CVDocumentProvider).activeComponent;

            CreateLightMenu
                .show(mainView, activeDoc.setup.language)
                .then(([selectedType, name]) => {
                    this.createLightNode(selectedType, name);
                    return true;
                })
                .catch(e => console.error("Error creating light:", e));
        }

        const activeNode: NVNode | undefined = this.nodeProvider.activeNode;
        if (activeNode?.light) {
            if (ins.name.changed && activeNode.name !== ins.name.value) {
                activeNode.name = ins.name.value;
                return true;
            }
            if (ins.delete.changed) {
                activeNode.dispose();
                return true;
            }

            const lightType: string = ELightType[(activeNode.light.constructor as any).type];
            if (ins.type.changed && ins.type.value !== lightType as unknown) {
                const newNode: NVNode = this.createLightNode(ins.type.value, activeNode.name);
                CVLightsTask.copyLightProperties(activeNode, newNode);
                activeNode.dispose();
                this.nodeProvider.activeNode = newNode;
                return true;
            }
        }
        return false;
    }

    protected createLightNode(newType: ELightType, newName: string): NVNode {
        const lightType = lightTypes.find(lt => lt.type === ELightType[newType].toString());
        if (!lightType) throw new Error(`Unsupported light type: '${newType}'`);

        const parentNode: NVNode = this.system.findNodeByName("Lights");
        const lightNode: NVNode = parentNode.graph.createCustomNode(parentNode);
        lightNode.transform.createComponent<ICVLight>(lightType);
        lightNode.name = newName;

        parentNode.transform.addChild(lightNode.transform);

        return lightNode;
    }

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