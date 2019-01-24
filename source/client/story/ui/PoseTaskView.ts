/**
 * 3D Foundation Project
 * Copyright 2018 Smithsonian Institution
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

import { customElement, html } from "@ff/ui/CustomElement";

import "@ff/ui/Splitter";
import "@ff/ui/Button";
import { IButtonClickEvent } from "@ff/ui/Button";

import CModel from "../../core/components/CModel";
import NItem from "../../explorer/nodes/NItem";
import CPoseTask, { EPoseManipMode } from "../components/CPoseTask";

import "./ItemList";
import "./PropertyView";
import TaskView from "./TaskView";

////////////////////////////////////////////////////////////////////////////////

@customElement("sv-pose-task-view")
export default class PoseTaskView extends TaskView
{
    protected task: CPoseTask;
    protected activeModel: CModel = null;

    protected setActiveItem(item: NItem)
    {
        this.activeModel = item ? item.model : null;
        this.requestUpdate();
    }

    protected firstConnected()
    {
        super.firstConnected();
        this.classList.add("sv-pose-task-view");
    }

    protected connected()
    {
        super.connected();
        this.task.ins.mode.on("value", this.onModeValue, this);
    }

    protected disconnected()
    {
        this.task.ins.mode.off("value", this.onModeValue, this);
        super.disconnected();
    }

    protected render()
    {
        const presentation = this.manager.activePresentation;
        const model = this.activeModel;

        if (!presentation || !model) {
            return html`<div class="sv-placeholder">Please select an item to edit its pose</div>`;
        }

        const modeProp = this.task.ins.mode;
        if (modeProp.value === EPoseManipMode.Off) {
            modeProp.setValue(EPoseManipMode.Rotate);
        }

        const globalUnits = presentation.scene.ins.units;
        const itemUnits = model.ins.units;
        const position = model.ins.position;
        const rotation = model.ins.rotation;

        return html`
            <div class="ff-flex-row ff-flex-wrap">
                <ff-button text="Rotate" index=${EPoseManipMode.Rotate} selectedIndex=${modeProp.value} @click=${this.onClickMode}></ff-button>
                <ff-button text="Move" index=${EPoseManipMode.Translate} selectedIndex=${modeProp.value} @click=${this.onClickMode}></ff-button>
                <ff-button text="Center" @click=${this.onClickCenter}></ff-button>
                <ff-button text="Zoom Views" @click=${this.onClickZoomViews}></ff-button>
            </div>
            <sv-property-view .property=${globalUnits} label="Global Units"></sv-property-view>    
            <sv-property-view .property=${itemUnits} label="Item Units"></sv-property-view>
            <sv-property-view .property=${position}></sv-property-view>
            <sv-property-view .property=${rotation}></sv-property-view>
        `;
    }

    protected onClickMode(event: IButtonClickEvent)
    {
        this.task.ins.mode.setValue(event.target.index);
    }

    protected onClickCenter()
    {
        this.manager.activeItem.model.ins.center.set();
    }

    protected onClickZoomViews()
    {
        this.manager.activePresentation.scene.zoomViews();
    }

    protected onModeValue()
    {
        this.requestUpdate();
    }
}
