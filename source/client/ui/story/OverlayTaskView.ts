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

import CVOverlayTask, { EPaintMode } from "../../components/CVOverlayTask";
import { TaskView, customElement, property, html } from "../../components/CVTask";

import CVDocument from "../../components/CVDocument";
import CVTargets from "../../components/CVTargets";
import { IButtonClickEvent } from "@ff/ui/Button";

import NVNode from "../../nodes/NVNode";

////////////////////////////////////////////////////////////////////////////////

@customElement("sv-overlay-task-view")
export default class OverlayTaskView extends TaskView<CVOverlayTask>
{
    protected featureConfigMode = false;
    protected targets: CVTargets = null;

    protected sceneview : HTMLElement = null;

    protected get snapshots() {
        return this.activeDocument.setup.snapshots;
    }
    //protected get manager() {
    //    return this.activeDocument.setup.targets;
    //}

    protected connected()
    {
        super.connected();
        this.task.on("update", this.onUpdate, this);

        // get sceneview for cursor updates
        const explorer = (this.getRootNode() as Element).getElementsByTagName("voyager-explorer")[0];
        this.sceneview = explorer.shadowRoot.querySelector(".sv-scene-view") as HTMLElement;
    }

    protected disconnected()
    {
        this.task.off("update", this.onUpdate, this);
        this.task.ins.paintMode.setValue(EPaintMode.Interact);

        super.disconnected();
    }

    protected renderFeatureMenu()
    {
        const features = this.snapshots.targetFeatures;
        const keys = Object.keys(features);

        const buttons = keys.map(key => {
            const title = key[0].toUpperCase() + key.substr(1);
            const selected = !!features[key];
            return html`<ff-button text=${title} name=${key} ?selected=${selected} @click=${this.onClickFeature}></ff-button>`;
        });

        return html`<div class="sv-commands">
            <ff-button text="OK" icon="" @click=${this.onFeatureMenuConfirm}></ff-button>
            <ff-button text="Cancel" icon="" @click=${this.onFeatureMenuCancel}></ff-button>
        </div><div class="ff-flex-item-stretch sv-tour-feature-menu">${buttons}</div>`;
    }

    protected render()
    {
        const task = this.task;
        const targets = this.targets;
        
        if (!targets) {
            return html`<div class="sv-placeholder">Please select a model to edit its targets.</div>`;
        }

        if (this.featureConfigMode) {
            return this.renderFeatureMenu();
        }

        this.sceneview.style.cursor = this.task.ins.paintMode.value === EPaintMode.Interact ? "grab" : "default";

        const targetList = targets.targets;
        const activeTarget = targets.activeTarget;
        const props = task.ins;

        const zoneConfig = activeTarget && activeTarget.type === "Zone" ? html`<div class="ff-scroll-y ff-flex-column sv-detail-view">
            <div class="sv-label"><b>Zone Configuration</b></div>
            <sv-property-view .property=${task.ins.zoneTitle}></sv-property-view>
            <sv-property-view .property=${task.ins.zoneColor}></sv-property-view>
            <div class="sv-label"><b>Painting Tools</b></div>
            <ff-button-group class="sv-commands">
                <ff-button text="Interact" icon="pointer" class="ff-control" @click=${this.onClickInteract}></ff-button>
                <ff-button text="Paint" icon="brush" class="ff-control" @click=${this.onClickPaint}></ff-button>
                <ff-button text="Erase" icon="eraser" class="ff-control" @click=${this.onClickErase}></ff-button>
            </ff-button-group>
            <sv-property-view .property=${task.ins.zoneBrushSize}></sv-property-view>
            <div class="sv-commands">
                <ff-button text="Fill All" class="ff-control" @click=${this.onClickFillAll}></ff-button>
                <ff-button text="Clear All" class="ff-control" @click=${this.onClickClearAll}></ff-button>
            </div>
        </div>` : null;


        return html`<div class="sv-commands">
            <ff-button text="Create" icon="create" @click=${this.onClickZoneCreate}></ff-button>       
            <ff-button text="Delete" icon="trash" ?disabled=${!activeTarget || activeTarget.type !== "Zone"} @click=${this.onClickZoneDelete}></ff-button>
            <ff-button text="Save" icon="save" @click=${this.onClickZoneSave}></ff-button>
        </div>
        <div class="ff-flex-item-stretch">
            <div class="ff-flex-column ff-fullsize">
                <div class="ff-splitter-section" style="flex-basis: 40%">
                    <div class="ff-scroll-y ff-flex-column">
                        <sv-target-list .data=${targetList.slice()} .selectedItem=${activeTarget} @select=${this.onSelectTarget}></sv-target-list>
                    </div>
                </div>
                <ff-splitter direction="vertical"></ff-splitter>
                <div class="ff-splitter-section" style="flex-basis: 60%">
                    ${zoneConfig}
                </div>
            </div>
        </div>`;
    }

    protected onClickConfig()
    {
        this.featureConfigMode = true;
        this.requestUpdate();
    }

    protected onSelectTarget(event: ISelectTargetEvent)
    {
        if( event.detail.index !== this.task.targets.ins.targetIndex.value ) {
            this.task.targets.ins.targetIndex.setValue(event.detail.index);
            this.requestUpdate();
        }
    }


    protected onFeatureMenuConfirm()
    {
        this.snapshots.updateTargets();

        this.featureConfigMode = false;
        this.requestUpdate();
    }

    protected onFeatureMenuCancel()
    {
        this.featureConfigMode = false;
        this.requestUpdate();
    }

    protected onClickFeature(event: IButtonClickEvent)
    {
        const features = this.snapshots.targetFeatures;
        const key = event.target.name;

        features[key] = !features[key];
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
            prevTargets.outs.targetIndex.off("value", this.onUpdate, this);
        }

        if(nextTargets)
        {
            this.targets = nextTargets;
            nextTargets.outs.targetIndex.on("value", this.onUpdate, this);
        }

        super.onActiveNode(previous, next);
    }

    // Handle adding new zone
    protected onClickZoneCreate()
    {
        this.task.ins.createZone.set();
    }

    // Handle zone delete
    protected onClickZoneDelete()
    {
        this.task.ins.deleteZone.set();
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

////////////////////////////////////////////////////////////////////////////////

interface ISelectTargetEvent extends CustomEvent
{
    target: TargetList;
    detail: {
        target: ITarget;
        index: number;
    }
}

@customElement("sv-target-list")
export class TargetList extends List<ITarget>
{
    @property({ attribute: false })
    selectedItem: ITarget = null;

    protected firstConnected()
    {
        super.firstConnected();
        this.classList.add("sv-target-list");
    }

    protected getClass(item: ITarget): string
    {
        if(item.type === "Header") {
            return "sv-target-list-header";
        }
        else {
            return "";
        }
    }

    protected renderItem(item: ITarget)
    {
        const hasTarget = item.snapshots.length > 0; 

        if(item.type === "Header") {
            return item.title;
        }
        else {
            return hasTarget ? html`${item.title}<div class="sv-target-colorbox" style="background-color:${item.color}"></div>` : html`${item.title}<div class="sv-target-colorbox" style="background-color:${item.color}"></div>`;
        }
    }

    protected isItemSelected(item: ITarget)
    {
        return item === this.selectedItem;
    }

    protected onClickItem(event: MouseEvent, item: ITarget, index: number)
    {
        this.dispatchEvent(new CustomEvent("select", {
            detail: { target: item, index }
        }));
    }

    protected onClickEmpty(event: MouseEvent)
    {
        this.dispatchEvent(new CustomEvent("select", {
            detail: { target: null, index: -1 }
        }));
    }
}