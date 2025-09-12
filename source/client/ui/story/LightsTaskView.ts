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
    const selectedNode = this.nodeProvider.activeNode;
    const detailView = null; // Name & type moved to Settings task

        return html`<div class="sv-commands">
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

    protected onClickDelete() { this.task.ins.delete.set(); }
}
