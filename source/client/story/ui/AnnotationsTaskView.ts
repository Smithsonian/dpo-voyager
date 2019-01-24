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

import TaskView from "./TaskView";
import CAnnotationsTask, { EAnnotationsTaskMode } from "../components/CAnnotationsTask";
import CAnnotations from "../../explorer/components/CAnnotations";
import NItem from "../../explorer/nodes/NItem";
import { IButtonClickEvent } from "@ff/ui/Button";

////////////////////////////////////////////////////////////////////////////////

@customElement("sv-annotations-task-view")
export default class AnnotationsTaskView extends TaskView
{
    protected task: CAnnotationsTask;
    protected activeAnnotations: CAnnotations = null;

    protected setActiveItem(item: NItem)
    {
        this.activeAnnotations = item ? item.annotations : null;
        this.requestUpdate();
    }

    protected firstConnected()
    {
        super.firstConnected();
        this.classList.add("sv-annotations-task-view");
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
        if (!this.activeAnnotations) {
            return html`<div class="sv-placeholder">Please select an item to edit its annotations</div>`;
        }

        const modeProp = this.task.ins.mode;

        return html`<div class="ff-flex-row ff-flex-wrap">
            <ff-button text="Off" index=${EAnnotationsTaskMode.Off} selectedIndex=${modeProp.value} @click=${this.onClickMode}></ff-button>       
            <ff-button text="Move" index=${EAnnotationsTaskMode.Move} selectedIndex=${modeProp.value} @click=${this.onClickMode}></ff-button>       
            <ff-button text="Create" index=${EAnnotationsTaskMode.Create} selectedIndex=${modeProp.value} @click=${this.onClickMode}></ff-button>       
            <ff-button text="Delete" @click=${this.onClickDelete}></ff-button>       
        </div>`;
    }

    protected onClickMode(event: IButtonClickEvent)
    {
        this.task.ins.mode.setValue(event.target.index);
    }

    protected onClickDelete()
    {

    }

    protected onModeValue()
    {
        this.requestUpdate();
    }
}