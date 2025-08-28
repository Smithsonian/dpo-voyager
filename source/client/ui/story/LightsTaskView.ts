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

import { lightTypes } from "client/applications/coreTypes";
import { ELightType } from "client/components/lights/CVLight";
import CVLightsTask from "../../components/CVLightsTask";
import { TaskView, customElement, html } from "../../components/CVTask";

@customElement("sv-light-task-view")
export default class LightsTaskView extends TaskView<CVLightsTask> {
    protected connected(): void {
        super.connected();
        this.task.on("update", this.onUpdate, this);
    }

    protected disconnected(): void {
        this.task.off("update", this.onUpdate, this);
        super.disconnected();
    }

    protected render() {
        const ins = this.task.ins;
        const selectedNode = this.nodeProvider.activeNode;

        if (selectedNode?.light) {
            ins.name.setValue(selectedNode.name);
            const lightType = lightTypes.find(lightType => lightType.typeName === selectedNode.light.typeName);
            if (!lightType) throw new Error(`Unsupported light type: '${lightType.typeName}'`);

            ins.type.setValue(ELightType[lightType.type]);
        }

        // TODO move light properties from Settings Task here?
        const detailView = selectedNode?.light ? html`<div class="ff-scroll-y ff-flex-column sv-detail-view">
            <sv-property-view .property=${ins.name}></sv-property-view>    
            <sv-property-view .property=${ins.type}></sv-property-view>
        </div>` : null;

        return html`<div class="sv-commands">
            <ff-button text="Create" icon="create" @click=${this.onClickCreate}></ff-button>
            <ff-button text="Delete" icon="trash" ?disabled=${!selectedNode?.light} @click=${this.onClickDelete}></ff-button>
        </div>
        <div class="ff-flex-item-stretch">
            <div class="ff-flex-column ff-fullsize">
                <div class="ff-splitter-section" style="flex-basis: 70%">
                    ${detailView}
                </div>
            </div>
        </div>`;
    }

    protected onClickCreate() {
        this.task.ins.create.set();
    }

    protected onClickDelete() {
        this.task.ins.delete.set();
    }
}
