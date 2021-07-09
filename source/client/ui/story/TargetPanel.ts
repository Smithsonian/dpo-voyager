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

import { IComponentEvent } from "@ff/graph/Component";

import CVDocument from "../../components/CVDocument";
import CVTargets from "../../components/CVTargets";
import CVTargetsTask, { EPaintMode } from "../../components/CVTargetsTask";

import DocumentView, { customElement, html } from "../explorer/DocumentView";
import DockPanel from "client/../../libs/ff-ui/source/DockPanel";

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
    protected isDrawing: boolean = false;
    protected isPanning: boolean = false;
    protected localOffsetTop: number = 0;
    protected localOffsetLeft: number = 0;
    protected panX: number = 0;
    protected panY: number = 0;
    protected savedMouseX: number = 0;
    protected savedMouseY: number = 0;
    protected zoomLevel: number = 1.0;
    protected drawBounds: DOMRect = null;
    protected targets: CVTargets = null;

    protected get targetsTask() {
        return this.system.getMainComponent(CVTargetsTask, true);
    }
    protected get manager() {
        return this.activeDocument.setup.targets;
    }

    protected firstConnected()
    {
        super.firstConnected();
        this.classList.add("sv-panel", "sv-target-panel");
    }

    protected connected()
    {
        super.connected();
        this.system.components.on(CVTargetsTask, this.onTargetsTask, this);

        const task = this.targetsTask;
        task && task.outs.isActive.on("value", this.onActiveTask, this);
    }

    protected disconnected()
    {
        const task = this.targetsTask;
        task && task.outs.isActive.off("value", this.onActiveTask, this);

        this.system.components.off(CVTargetsTask, this.onTargetsTask, this);
        super.disconnected();
    }

    protected render()
    {
        const task = this.targetsTask;
       
        if (!task /*|| !task.outs.isActive.value*/) {
            return html`<div class="ff-placeholder">Target edit task not available.</div>`;
        }

        const targets = task.targets;
        
        if (!targets) {
            return html`<div class="ff-placeholder">Please select a model to edit targets.</div>`;
        }

        const activeTarget = targets.activeTarget;

        if (!activeTarget) {
            return html`<div class="ff-placeholder">Please select a target to edit.</div>`;
        }

        const activeSnapshot = targets.activeSnapshot;

        // zone map config
        const targetConfigView = activeTarget.type === "Zone" ? html`<div @contextmenu=${this.onContextMenu} @wheel=${this.onScrollWheel} @mousedown=${this.onPointerDown} @mouseup=${this.onPointerUp} @mousemove=${this.onPointerMove}>${task.baseCanvas} ${task.zoneCanvas}</div>` : null; 

        const activeButton = targets.activeSnapshots.length > 0 ? html`<ff-button text="Update" icon="camera" @click=${this.onClickUpdate}></ff-button>` 
            : html`<ff-button text="Create" icon="create" @click=${this.onClickCreate}></ff-button>`;

        const targetDetailView = targets.activeSnapshots.length > 0 ?  html`<div class="ff-scroll-y ff-flex-column sv-detail-view">
        <sv-property-view .property=${task.ins.snapshotTitle}></sv-property-view>
        <sv-property-view .property=${task.ins.snapshotCurve}></sv-property-view>
        <sv-property-view .property=${task.ins.snapshotDuration} commitonly></sv-property-view>
        <sv-property-view .property=${task.ins.snapshotThreshold} commitonly></sv-property-view>
        </div>` : html`<div class="ff-placeholder"><div>Create a target snapshot to edit.</div></div>`;

        return html`<div class="sv-panel-header">
            ${activeButton}
            <ff-button text="Delete" icon="trash" ?disabled=${!activeSnapshot} @click=${this.onClickDelete}></ff-button>
        </div>
        <div class="ff-flex-item-stretch ff-flex-row" style="overflow: overlay">
            <div class="ff-splitter-section" style="flex-basis: 40%;">
                ${targetDetailView}
            </div>
            <ff-splitter></ff-splitter>
            <div class="ff-splitter-section" style="flex-basis: 60%;">
                ${targetConfigView}
            </div>
        </div>`;
    }

    protected onClickUpdate()
    {
        this.targetsTask.ins.updateSnapshot.set();
    }

    protected onClickCreate()
    {
        this.targetsTask.ins.createSnapshot.set();
    }

    protected onClickDelete()
    {
        this.targetsTask.ins.deleteSnapshot.set();
    }

    protected onActiveDocument(previous: CVDocument, next: CVDocument)
    {
        this.requestUpdate();
    }

    protected onActiveNode()
    {
        const prevTargets = this.targets;
        const nextTargets = this.targetsTask.targets;

        if(prevTargets)
        {
            prevTargets.outs.targetIndex.off("value", this.onUpdate, this);
            prevTargets.outs.snapshotIndex.off("value", this.onUpdate, this);
        }

        if(nextTargets)
        {       
            this.targets = nextTargets;
            this.targets.outs.targetIndex.on("value", this.onUpdate, this);
            this.targets.outs.snapshotIndex.on("value", this.onUpdate, this); 

            // reset canvas
            if(this.zoomLevel !== 1.0 || this.panX !== 0.0 || this.panY !== 0.0) {
                this.zoomLevel = 1.0;
                this.panX = 0.0;
                this.panY= 0.0;
            }
            this.applyCanvasTransform();
        }

        this.requestUpdate();
    }

    protected onTargetsTask(event: IComponentEvent<CVTargetsTask>)
    {
        if (event.add) {
            event.object.outs.isActive.on("value", this.onActiveTask, this);
            event.object.ins.activeNode.on("value", this.onActiveNode, this);
        }
        if (event.remove) {
            event.object.outs.isActive.off("value", this.onActiveTask, this);
            event.object.ins.activeNode.off("value", this.onActiveNode, this);
        }

        this.requestUpdate();
    }

    protected onActiveTask() 
    {
        (this.parentElement as DockPanel).activatePanel();
        this.onUpdate();
    }

    protected onPointerDown(event: MouseEvent)
    {
        // do not handle if task is not active
        if (!this.targetsTask.outs.isActive.value) {
            return;
        }

        if(this.targetsTask.ins.paintMode.value != EPaintMode.Interact && event.button == 0)  // left mouse button
        {
            this.isDrawing = true;

            // calculate image offset from canvas element
            const canvas = this.targetsTask.zoneCanvas;
            this.drawBounds = canvas.getBoundingClientRect();

            const origRatio = canvas.width / canvas.height;
            const currRatio = this.drawBounds.width / this.drawBounds.height;

            if(origRatio > currRatio) {
                const height = this.drawBounds.width / origRatio;
                this.localOffsetTop = (this.drawBounds.height - height) / 2;
                this.localOffsetLeft = 0; 
            }
            else {
                const width = this.drawBounds.height * origRatio;
                this.localOffsetLeft = (this.drawBounds.width - width) / 2;
                this.localOffsetTop = 0;
            }

            let adjX = (event.clientX-this.drawBounds.left-this.localOffsetLeft)/(this.drawBounds.width-this.localOffsetLeft*2.0); 
            let adjY = (event.clientY-this.drawBounds.top-this.localOffsetTop)/(this.drawBounds.height-this.localOffsetTop*2.0);
            canvas.getContext('2d').beginPath();
            canvas.getContext('2d').moveTo(adjX*canvas.width, adjY*canvas.height);

            const refresh = this.targetsTask.zoneTexture;
            this.targets.ins.visible.setValue(true);
        }
        else
        {
            this.savedMouseX = event.clientX;
            this.savedMouseY = event.clientY;
            this.isPanning = true;
        }
    }

    protected onPointerMove(event: MouseEvent)
    {
        if(this.isDrawing) {
            this.drawToZone(event.clientX, event.clientY);
        }

        if(this.isPanning) {
            if(this.zoomLevel <= 1.0) {
                return;
            }

            this.panX += (event.clientX - this.savedMouseX)/this.zoomLevel;
            this.panY += (event.clientY - this.savedMouseY)/this.zoomLevel;

            this.applyCanvasTransform();

            this.savedMouseX = event.clientX;
            this.savedMouseY = event.clientY; 
        }
    }

    protected onPointerUp(event: MouseEvent)
    {
        this.isDrawing = false;
        this.isPanning = false;
    }

    protected onContextMenu(event: MouseEvent)
    {
        event.preventDefault();
    }

    protected onScrollWheel(event: WheelEvent)
    {
        //console.log(event.deltaY);
        this.zoomLevel += -(event.deltaY/1000)*2;

        // early out
        if(this.zoomLevel < 1.0) {
            this.zoomLevel = 1.0;
            return;
        }

        if(this.zoomLevel === 1.0) {
            this.panX = 0;
            this.panY = 0;
        }

        this.applyCanvasTransform();
    }

    protected drawToZone(x: number, y: number)
    {
        const canvas = this.targetsTask.zoneCanvas;
        const clientRect = this.drawBounds;

        let adjX = (x-clientRect.left-this.localOffsetLeft)/(clientRect.width-this.localOffsetLeft*2.0);
        let adjY = (y-clientRect.top-this.localOffsetTop)/(clientRect.height-this.localOffsetTop*2.0);
        canvas.getContext('2d').lineTo(Math.floor(adjX*canvas.width), Math.floor(adjY*canvas.height));
        canvas.getContext('2d').stroke();

        //canvas.getContext('2d').fillRect(adjX*canvas.width, adjY*canvas.height, 70, 70);

        this.targetsTask.updateZoneTexture();
    }

    protected applyCanvasTransform() {
        const transformString = "scale(" + this.zoomLevel + ", " + this.zoomLevel + ") translate(" + this.panX + "px, " + this.panY + "px)";

        const canvas = this.targets.zoneCanvas;
        const base = this.targetsTask.baseCanvas;

        canvas.style.transform = transformString;
        base.style.transform = transformString;
    }
}