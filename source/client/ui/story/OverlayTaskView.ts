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

    protected render()
    {
        const task = this.task;
        const targets = this.targets;
        
        if (!targets) {
            return html`<div class="sv-placeholder">Please select a model to edit its overlays.</div>`;
        }

        const targetList = targets.targets;
        const activeOverlay = targets.activeTarget;
        const props = task.ins;

        this.sceneview.style.cursor = props.paintMode.value === EPaintMode.Interact ? "grab" : "default";

        const overlayConfig = html`<div class="ff-scroll-y ff-flex-column sv-detail-view">
            <div class="sv-label"><b>Overlays</b></div>
            <sv-property-view .property=${props.overlayTitle}></sv-property-view>
            <sv-property-view .property=${props.overlayColor}></sv-property-view>
            <div class="sv-label"><b>Painting Tools</b></div>
            <ff-button-group class="sv-commands">
                <ff-button text="Interact" icon="pointer" class="ff-control" @click=${this.onClickInteract}></ff-button>
                <ff-button text="Paint" icon="brush" class="ff-control" @click=${this.onClickPaint}></ff-button>
                <ff-button text="Erase" icon="eraser" class="ff-control" @click=${this.onClickErase}></ff-button>
            </ff-button-group>
            <sv-property-view .property=${props.overlayBrushSize}></sv-property-view>
            <div class="sv-commands">
                <ff-button text="Fill All" class="ff-control" @click=${this.onClickFillAll}></ff-button>
                <ff-button text="Clear All" class="ff-control" @click=${this.onClickClearAll}></ff-button>
            </div>
        </div>`;


        return html`<div class="sv-commands">
            <ff-button text="Create" icon="create" @click=${this.onClickOverlayCreate}></ff-button>       
            <ff-button text="Delete" icon="trash" ?disabled=${!activeOverlay} @click=${this.onClickOverlayDelete}></ff-button>
            <ff-button text="Save" icon="save" @click=${this.onClickOverlaySave}></ff-button>
        </div>
        <div class="ff-flex-item-stretch">
            <div class="ff-flex-column ff-fullsize">
                <div class="ff-splitter-section" style="flex-basis: 40%">
                    <div class="ff-scroll-y ff-flex-column">
                        <sv-target-list .data=${targetList.slice()} .selectedItem=${activeOverlay} @select=${this.onSelectOverlay}></sv-target-list>
                    </div>
                </div>
                <ff-splitter direction="vertical"></ff-splitter>
                <div class="ff-splitter-section" style="flex-basis: 60%">
                    ${overlayConfig}
                </div>
            </div>
        </div>`;
    }

    protected onClickConfig()
    {
        this.featureConfigMode = true;
        this.requestUpdate();
    }

    protected onSelectOverlay(event: ISelectOverlayEvent)
    {
        if( event.detail.index !== this.task.ins.activeIndex.value ) {
            this.task.ins.activeIndex.setValue(event.detail.index);
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

    // Handle adding new overlay
    protected onClickOverlayCreate()
    {
        this.task.ins.createOverlay.set();
    }

    // Handle overlay delete
    protected onClickOverlayDelete()
    {
        this.task.ins.deleteOverlay.set();
    }

    // Handle overlay save
    protected onClickOverlaySave()
    {
        this.task.ins.saveOverlays.set();
    }

    // Handle overlay fill
    protected onClickFillAll()
    {
        this.task.ins.overlayFill.set();
    }

    // Handle overlay clear
    protected onClickClearAll()
    {
        this.task.ins.overlayClear.set();
    }

    // Handle overlay mode changes
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

interface ISelectOverlayEvent extends CustomEvent
{
    target: OverlayList;
    detail: {
        overlay: ITarget;
        index: number;
    }
}

@customElement("sv-target-list")
export class OverlayList extends List<ITarget>
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