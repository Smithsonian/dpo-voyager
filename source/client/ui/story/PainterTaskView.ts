/**
 * 3D Foundation Project
 * Copyright 2020 Smithsonian Institution
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


import List from "@ff/ui/List";

import { ITarget } from "client/schema/model";

import CVTargetsTask, { EPaintMode } from "../../components/CVTargetsTask";
import { TaskView, customElement, property, html } from "../../components/CVTask";

import CVDocument from "../../components/CVDocument";
import CVTargets from "../../components/CVTargets";
import TargetPanel from "./TargetPanel";
import { IButtonClickEvent } from "@ff/ui/Button";

import NVNode from "../../nodes/NVNode";

////////////////////////////////////////////////////////////////////////////////

@customElement("sv-painter-task-view")
export default class PainterTaskView extends TaskView<CVTargetsTask>
{
    protected featureConfigMode = false;
    protected targets: CVTargets = null;

    protected get snapshots() {
        return this.activeDocument.setup.snapshots;
    }
    protected get manager() {
        return this.activeDocument.setup.targets;
    }

    protected connected()
    {
        super.connected();
        this.task.on("update", this.onUpdate, this);
    }

    protected disconnected()
    {
        this.task.off("update", this.onUpdate, this);
        super.disconnected();
    }

    protected render()
    {
        const task = this.task;
        const targets = this.targets;
        
        if (!targets) {
            return html`<div class="sv-placeholder">Please select a model to paint.</div>`;
        }

        const targetList = targets.targets;
        const activeTarget = targets.activeTarget;
        const props = task.ins;

        return html`<div class="ff-scroll-y ff-flex-column sv-detail-view">        
            <div class="sv-label"><b>Painting Tools</b></div>
            <div class="sv-property-view">
                <div class="sv-property-name">Color</div>
                <div class="sv-property-value">
                    <ff-property-view .property=${task.ins.zoneColor} ></ff-property-view>
                </div>
            </div>

            <sv-property-view .property=${task.ins.zoneBrushSize}></sv-property-view>

            <ff-button-group selectionIndex=${props.paintMode.value} class="sv-commands">
                <ff-button text="Interact" icon="pointer" class="ff-control" @click=${this.onClickInteract}></ff-button>
                <ff-button text="Paint" icon="brush" class="ff-control" @click=${this.onClickPaint}></ff-button>
                <ff-button text="Erase" icon="eraser" class="ff-control" @click=${this.onClickErase}></ff-button>
            </ff-button-group>
            <div class="sv-commands">
                <ff-button text="Fill All" class="ff-control" @click=${this.onClickFillAll}></ff-button>
                <ff-button text="Clear All" class="ff-control" @click=${this.onClickClearAll}></ff-button>
            </div>
        </div>`;

    }

    protected onClickConfig()
    {
        this.featureConfigMode = true;
        this.requestUpdate();
    }

    protected onActiveDocument(previous: CVDocument, next: CVDocument)
    {
        this.requestUpdate();
    }

    protected onActiveNode(previous: NVNode, next: NVNode)
    {
        const prevTargets = previous ? previous.getComponent(CVTargets, true) : null;
        const nextTargets = next ? next.getComponent(CVTargets, true) : null;

        if(prevTargets)
        {
            this.targets = null;
            prevTargets.outs.targetIndex.off("value", this.onUpdate, this);
        }

        if(nextTargets)
        {
            this.targets = nextTargets;
            nextTargets.outs.targetIndex.on("value", this.onUpdate, this);
        }

        super.onActiveNode(previous, next);
    }

    // Handle zone save
    protected onClickZoneSave()
    {
        this.task.ins.saveZones.set();
    }

    // Handle zone fill
    protected onClickFillAll()
    {
        this.task.ins.zoneFill.set();
    }

    // Handle zone clear
    protected onClickClearAll()
    {
        this.task.ins.zoneClear.set();
    }

    // Handle zone mode changes
    protected onClickInteract()
    {
        this.task.ins.paintMode.setValue(EPaintMode.Interact); 
    }
    protected onClickPaint()
    {
        this.task.ins.paintMode.setValue(EPaintMode.Paint);
    }
    protected onClickErase()
    {
        this.task.ins.paintMode.setValue(EPaintMode.Erase); 
    }
}