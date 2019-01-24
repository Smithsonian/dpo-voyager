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

    protected render()
    {
        if (!this.activeItem) {
            return html`<div class="sv-placeholder">Please select an item to take a picture</div>`;
        }

        return html`<div class="ff-flex-row ff-flex-wrap">
            <ff-button text="Capture" icon="camera" @click=${this.onClickCapture}></ff-button>
            <ff-button text="Save" icon="save" @click=${this.onClickSave}></ff-button>
        </div>`;
    }

    protected onClickCapture()
    {

    }

    protected onClickSave()
    {

    }
}
