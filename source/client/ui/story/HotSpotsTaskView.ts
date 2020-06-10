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


import List from "@ff/ui/List";

import { ITarget } from "client/schema/model";

import CVHotSpotsTask from "../../components/CVHotSpotsTask";
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
       
        const node = this.activeNode;
        const targets = this.targets; //node && node.getComponent(CVTargets, true);
        
        if (!targets) {
            return html`<div class="sv-placeholder">Please select a model to edit its targets.</div>`;
        }
        else { console.log(targets.ins.enabled.value);
            //if(!targets.ins.enabled.value)
            //    targets.ins.enabled.setValue(true);
        }

        if (this.featureConfigMode) {
            return this.renderFeatureMenu();
        }

        const targetList = targets.targets;
        const activeTarget = targets.activeTarget;
        const props = task.ins;

        const zoneView = activeTarget ? html`<div class="ff-scroll-y ff-flex-column sv-detail-view">
            <div class="sv-label"><b>Zone Configuration</b></div>
        </div>` : null;

        return html`<div class="sv-commands">
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
                    ${zoneView}
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
            this.task.targets.ins.targetIndex.setValue(event.detail.index); console.log("Target Index changed %d", event.detail.index);
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

    protected onTextEdit(event: ILineEditChangeEvent)
    {
        const task = this.task;
        const target = event.target;
        const text = event.detail.text;

        if (target.name === "title") {
            task.ins.tourTitle.setValue(text);
        }
        else if (target.name === "lead") {
            task.ins.tourLead.setValue(text);
        }
        else if (target.name === "tags") {
            task.ins.tourTags.setValue(text);
        }
    }

    protected onActiveDocument(previous: CVDocument, next: CVDocument)
    {
        /*if (previous) {
            previous.setup.tours.outs.tourIndex.off("value", this.onUpdate, this);
        }
        if (next) {
            next.setup.tours.outs.tourIndex.on("value", this.onUpdate, this);
        }*/

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