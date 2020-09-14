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

import CVHotSpotsTask from "../../components/CVTargetsTask";
import { TaskView, customElement, property, html } from "../../components/CVTask";
import { ILineEditChangeEvent } from "@ff/ui/LineEdit";

import CVDocument from "../../components/CVDocument";
import CVTargets from "../../components/CVTargets";
import { IButtonClickEvent } from "@ff/ui/Button";

import NVNode from "../../nodes/NVNode";

////////////////////////////////////////////////////////////////////////////////

@customElement("sv-hotspots-task-view")
export default class HotSpotsTaskView extends TaskView<CVHotSpotsTask>
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

        const targetList = targets.targets;
        const activeTarget = targets.activeTarget;
        const props = task.ins;

        const zoneConfig = activeTarget && activeTarget.type === "Zone" ? html`<div class="ff-scroll-y ff-flex-column sv-detail-view">
            <div class="sv-label"><b>Zone Configuration</b></div>
            <sv-property-view .property=${task.ins.zoneTitle}></sv-property-view>
            <div class="sv-property-view">
                <div class="sv-property-name">Color</div>
                <div class="sv-property-value">
                    <ff-property-view .property=${task.ins.zoneColor} ></ff-property-view>
                </div>
                <ff-button text="X" class="ff-property-button ff-control sv-property-button" ?selected=${props.zoneErase.value} @click=${this.onClickErase}></ff-button>
            </div>
            <sv-property-view .property=${task.ins.zoneBrushSize}></sv-property-view>
        </div>` : null;


        return html`<div class="sv-commands">
            <ff-button text="Create" icon="create" @click=${this.onClickZoneCreate}></ff-button>       
            <ff-button text="Delete" icon="trash" ?disabled=${!activeTarget || activeTarget.type !== "Zone"} @click=${this.onClickZoneDelete}></ff-button>
            <ff-button text="Save" icon="save" ?disabled=${!targets.ins.active.value} @click=${this.onClickZoneSave}></ff-button>
            <ff-button title="Snapshot Configuration" icon="bars" @click=${this.onClickConfig}></ff-button>
        </div>
        <div class="ff-flex-item-stretch">
            <div class="ff-flex-column ff-fullsize">
                <div class="ff-splitter-section" style="flex-basis: 60%">
                    <div class="ff-scroll-y ff-flex-column">
                        <sv-target-list .data=${targetList.slice()} .selectedItem=${activeTarget} @select=${this.onSelectTarget}></sv-target-list>
                    </div>
                </div>
                <ff-splitter direction="vertical"></ff-splitter>
                <div class="ff-splitter-section" style="flex-basis: 40%">
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
        if(this.manager.ins.engaged.value)
        {
            super.onActiveNode(previous, next);
            return;
        }

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

    // Set zone color to erase
    protected onClickErase()
    {
        this.task.ins.zoneErase.setValue(!this.task.ins.zoneErase.value); 
        console.log("ERASE");
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
            return hasTarget ? html`<ff-icon class='sv-icon-active-target' name='target'></ff-icon>${item.title}` : html`<ff-icon class='sv-icon-model' name='target'></ff-icon>${item.title}`;
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