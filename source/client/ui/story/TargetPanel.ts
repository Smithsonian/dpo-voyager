/**
 * 3D Foundation Project
 * Copyright 2019 Smithsonian Institution
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

import Subscriber from "@ff/core/Subscriber";
import { IComponentEvent } from "@ff/graph/Component";
import { EEasingCurve, ITweenState } from "@ff/graph/components/CTweenMachine";

import Table, { ITableColumn, ITableRowClickEvent } from "@ff/ui/Table";

import CVDocument from "../../components/CVDocument";
import CVTargets from "../../components/CVTargets";
import CVHotSpotsTask from "../../components/CVHotSpotsTask";
import CVTargetManager from "../../components/CVTargetManager";

import DocumentView, { customElement, html } from "../explorer/DocumentView";
import NVNode from "../../nodes/NVNode";


////////////////////////////////////////////////////////////////////////////////

interface IStepEntry
{
    title: string;
    curve: string;
    duration: string;
    threshold: string;
}

@customElement("sv-target-panel")
export default class TargetPanel extends DocumentView
{
    protected static tableColumns: ITableColumn<IStepEntry>[] = [
        { header: "#", width: 0.05, cell: (row, index) => index.toString() },
        { header: "Title", width: 0.4, cell: "title" },
        { header: "Curve", width: 0.25, cell: "curve" },
        { header: "Duration", width: 0.15, cell: "duration" },
        { header: "Threshold", width: 0.15, cell: "threshold" },
    ];

    protected stateTable: Table<IStepEntry> = null;
    protected subscriber: Subscriber = null;
    targets: CVTargets = null;

    protected get targetsTask() {
        return this.system.getMainComponent(CVHotSpotsTask, true);
    }
    protected get manager() {
        return this.activeDocument.setup.targets;
    }

    protected firstConnected()
    {
        super.firstConnected();
        this.classList.add("sv-panel", "sv-target-panel");

        //this.stateTable = new Table();
        //this.stateTable.columns = TargetPanel.tableColumns;
        //this.stateTable.placeholder = "Start by creating a target step.";
        //this.stateTable.addEventListener("rowclick", this.onClickTableRow.bind(this));

        this.subscriber = new Subscriber("value", this.onUpdate, this);
    }

    protected connected()
    {
        super.connected();
        this.system.components.on(CVHotSpotsTask, this.onTargetsTask, this);

        const task = this.targetsTask;
        task && task.outs.isActive.on("value", this.onUpdate, this);
    }

    protected disconnected()
    {
        const task = this.targetsTask;
        task && task.outs.isActive.off("value", this.onUpdate, this);

        this.system.components.off(CVHotSpotsTask, this.onTargetsTask, this);
        super.disconnected();
    }

    protected render()
    {
        //console.log("TargetPanel.render");

        const task = this.targetsTask;
       
        if (!task /*|| !task.outs.isActive.value*/) {
            return html`<div class="ff-placeholder">Target edit task not available.</div>`;
        }

        const targets = task.targets;
        
        if (!targets) {
            return html`<div class="ff-placeholder">Please select a model to edit targets.</div>`;
        }

        const machine = targets.snapshots;
        const activeTarget = targets.activeTarget;

        if (!activeTarget) {
            return html`<div class="ff-placeholder">Please select a target to edit.</div>`;
        }

        const activeZone = targets.activeZone;

        // reserved for future config
        const targetConfigView = null; 

        const activeButton = targets.activeZones.length > 0 ? html`<ff-button text="Update" icon="camera" @click=${this.onClickUpdate}></ff-button>` 
            : html`<ff-button text="Create" icon="create" @click=${this.onClickCreate}></ff-button>`;

        const targetDetailView = targets.activeZones.length > 0 ?  html`<div class="ff-scroll-y ff-flex-column sv-detail-view">
        <sv-property-view .property=${task.ins.stepTitle}></sv-property-view>
        <sv-property-view .property=${task.ins.stepCurve}></sv-property-view>
        <sv-property-view .property=${task.ins.stepDuration} commitonly></sv-property-view>
        <sv-property-view .property=${task.ins.stepThreshold} commitonly></sv-property-view>
        </div>` : html`<div class="ff-placeholder"><div>Create a target snapshot to edit.</div></div>`;

        return html`<div class="sv-panel-header">
            ${activeButton}
            <ff-button text="Delete" icon="trash" ?disabled=${!activeZone} @click=${this.onClickDelete}></ff-button>
        </div>
        <div class="ff-flex-item-stretch ff-flex-row">
            <div class="ff-splitter-section" style="flex-basis: 60%">
                ${targetDetailView}
            </div>
            <ff-splitter></ff-splitter>
            <div class="ff-splitter-section" style="flex-basis: 40%">
                ${targetConfigView}
            </div>
        </div>`;
    }

    /*protected onClickTableRow(event: ITableRowClickEvent<ITweenState>)
    {
        this.targets.ins.zoneIndex.setValue(event.detail.index);
    }*/

    protected onClickUpdate()
    {
        this.targetsTask.ins.updateStep.set();
    }

    protected onClickCreate()
    {
        this.targetsTask.ins.createZone.set();
    }

    protected onClickDelete()
    {
        this.targetsTask.ins.deleteStep.set();
    }

    protected onActiveDocument(previous: CVDocument, next: CVDocument)
    {
        if (previous) {
            this.subscriber.off();
        }
        if (next) {
            /*this.targets = next.setup.targets;
            this.subscriber.on(
                this.targets.ins.enabled,
                this.targets.ins.targetIndex,
                this.targets.outs.stepIndex
            );*/
        }

        this.requestUpdate();
    }

    protected onActiveNode()
    {
        if(this.manager.ins.engaged.value)
        {
            return;
        }

        const prevTargets = this.targets;
        const nextTargets = this.targetsTask.targets;

        if(prevTargets)
        {
            prevTargets.outs.targetIndex.off("value", this.onUpdate, this);
            prevTargets.outs.zoneIndex.off("value", this.onUpdate, this);
        }

        if(nextTargets)
        {       
            this.targets = nextTargets;
            this.targets.outs.targetIndex.on("value", this.onUpdate, this);
            this.targets.outs.zoneIndex.on("value", this.onUpdate, this); 
        }

        this.requestUpdate();
    }

    protected onTargetsTask(event: IComponentEvent<CVHotSpotsTask>)
    {
        if (event.add) {
            event.object.outs.isActive.on("value", this.onUpdate, this);
            event.object.ins.activeNode.on("value", this.onActiveNode, this);
        }
        if (event.remove) {
            event.object.outs.isActive.off("value", this.onUpdate, this);
            event.object.ins.activeNode.off("value", this.onUpdate, this);
        }

        this.requestUpdate();
    }
}