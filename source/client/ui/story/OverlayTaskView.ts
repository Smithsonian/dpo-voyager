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

import CVOverlayTask, { EPaintMode } from "../../components/CVOverlayTask";
import { TaskView, customElement, property, html } from "../../components/CVTask";

import CVDocument from "../../components/CVDocument";

import NVNode from "../../nodes/NVNode";
import CVModel2, { IOverlay } from "../../components/CVModel2";
import { EDerivativeQuality } from "client/schema/model";

////////////////////////////////////////////////////////////////////////////////

@customElement("sv-overlay-task-view")
export default class OverlayTaskView extends TaskView<CVOverlayTask>
{
    protected featureConfigMode = false;

    protected sceneview : HTMLElement = null;
    protected activeModel: CVModel2;

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
        const overlays = task.overlays;

        if (!this.activeModel) {
            return html`<div class="sv-placeholder">Please select a model to edit its overlays.</div>`;
        }

        const props = task.ins;
        const activeOverlay = overlays[props.activeIndex.value];
        const activeQuality = this.activeModel.activeDerivative.data.quality;

        this.sceneview.style.cursor = props.paintMode.value === EPaintMode.Interact ? "grab" : "default";

        const overlayConfig = activeOverlay ? html`<div class="ff-scroll-y ff-flex-column sv-detail-view">
            <div class="sv-label"><b>Overlay Editing [${EDerivativeQuality[activeQuality]} Derivative]</b></div>
            <sv-property-view .property=${props.overlayColor}></sv-property-view>
            <sv-property-view .property=${props.overlayOpacity}></sv-property-view>
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
        </div>` : null;


        return html`<div class="sv-commands">
            <ff-button text="Create" icon="create" @click=${this.onClickOverlayCreate}></ff-button>       
            <ff-button text="Delete" icon="trash" ?disabled=${!activeOverlay} @click=${this.onClickOverlayDelete}></ff-button>
            <ff-button text="Save" icon="save" ?disabled=${!activeOverlay} @click=${this.onClickOverlaySave}></ff-button>
        </div>
        <div class="ff-flex-item-stretch">
            <div class="ff-flex-column ff-fullsize">
                <div class="ff-flex-row ff-group"><div class="sv-panel-header sv-task-item sv-task-item-full">Overlay Images</div></div>
                <div class="ff-splitter-section" style="flex-basis: 40%">
                    <div class="ff-scroll-y ff-flex-column">
                        <sv-overlay-list .data=${overlays.slice()} .selectedItem=${activeOverlay} @select=${this.onSelectOverlay}></sv-overlay-list>
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

    protected onActiveDocument(previous: CVDocument, next: CVDocument)
    {
        this.requestUpdate();
    }

    protected onActiveNode(previous: NVNode, next: NVNode)
    {
        this.activeModel = null;

        if(previous && previous.model)
        {           
        }

        if(next && next.model)
        {
            this.activeModel = next.model;
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
        overlay: IOverlay;
        index: number;
    }
}

@customElement("sv-overlay-list")
export class OverlayList extends List<IOverlay>
{
    @property({ attribute: false })
    selectedItem: IOverlay = null;

    protected firstConnected()
    {
        super.firstConnected();
        this.classList.add("sv-overlay-list");
    }

    protected renderItem(item: IOverlay)
    {
        return html`${item.isDirty ? "(unsaved) " : null}${item.asset.data.uri}`;
    }

    protected isItemSelected(item: IOverlay)
    {
        return item === this.selectedItem;
    }

    protected onClickItem(event: MouseEvent, item: IOverlay, index: number)
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