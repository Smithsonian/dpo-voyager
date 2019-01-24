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

import NItem from "../../explorer/nodes/NItem";
import CCaptureTask from "../components/CCaptureTask";

import "./ItemList";
import TaskView from "./TaskView";

////////////////////////////////////////////////////////////////////////////////

@customElement("sv-capture-task-view")
export default class CaptureTaskView extends TaskView
{
    protected task: CCaptureTask;
    protected activeItem: NItem = null;

    protected setActiveItem(item: NItem)
    {
        this.activeItem = item;
        this.requestUpdate();
    }

    protected firstConnected()
    {
        super.firstConnected();
        this.classList.add("sv-capture-task-view");
    }

    protected connected()
    {
        super.connected();
        this.task.outs.taken.on("value", this.onPictureTaken, this);
    }

    protected disconnected()
    {
        this.task.outs.taken.off("value", this.onPictureTaken, this);
        super.disconnected();
    }

    protected render()
    {
        if (!this.activeItem) {
            return html`<div class="sv-placeholder">Please select an item to take a picture</div>`;
        }

        const ins = this.task.ins;
        const dataURL = this.task.imageDataURL;
        const image = dataURL ? html`<div class="sv-label">Preview</div>
            <div class="sv-image"><img alt="Capture" src=${dataURL}></div>` : null;

        return html`<div class="ff-flex-row ff-flex-wrap">
                <ff-button text="Take" icon="camera" @click=${this.onClickCapture}></ff-button>
                <ff-button text="Save" icon="save" @click=${this.onClickSave}></ff-button>
            </div>
            <sv-property-view .property=${ins.preset}></sv-property-view>
            <sv-property-view .property=${ins.width}></sv-property-view>
            <sv-property-view .property=${ins.height}></sv-property-view>
            ${image}
        `;
    }

    protected onClickCapture()
    {
        this.task.ins.take.set();
    }

    protected onClickSave()
    {
        this.task.ins.save.set();
    }

    protected onPictureTaken()
    {
        this.requestUpdate();
    }
}
