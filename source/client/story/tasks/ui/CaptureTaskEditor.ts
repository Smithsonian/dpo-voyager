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
import "@ff/ui/Layout";
import "@ff/ui/Splitter";
import "@ff/ui/Button";

import Model from "../../../core/components/Model";

import "../../ui/ItemList";
import ItemProperties from "../../ui/ItemProperties";

import TaskEditor from "./TaskEditor";
import CaptureTask from "../CaptureTask";

////////////////////////////////////////////////////////////////////////////////

@customElement("sv-capture-task-editor")
export default class CaptureTaskEditor extends TaskEditor
{
    protected task: CaptureTask;

    protected firstConnected()
    {
        super.firstConnected();

        this.setStyle({
            display: "flex",
            flexDirection: "column"
        });
    }

    protected render()
    {
        const system = this.task.system;

        return html`
            <div class="sv-section" style="flex: 1 1 25%">
                <sv-item-list .system=${system} .componentType=${Model}></sv-item-list>
            </div>
            <ff-splitter direction="vertical"></ff-splitter>
            <div class="sv-section" style="flex: 1 1 75%">
                <sv-item-capture-properties .system=${system}></sv-item-capture-properties>
            </div>
        `;
    }
}

////////////////////////////////////////////////////////////////////////////////

@customElement("sv-item-capture-properties")
class ItemCaptureProperties extends ItemProperties<Model>
{
    constructor()
    {
        super(Model);
    }

    protected render()
    {
        const model = this.component;
        console.log("capPropRender", model);
        if (!model) {
            return html``;
        }

        return html`
            <ff-flex-row wrap>
                <ff-button text="Capture" icon="fa fa-camera" @click=${this.onClickCapture}></ff-button>
                <ff-button text="Save" icon="fa fa-save" @click=${this.onClickSave}></ff-button>
            </ff-flex-row>
        `;
    }

    protected onClickCapture()
    {

    }

    protected onClickSave()
    {

    }

    protected setComponent(model: Model)
    {
        super.setComponent(model);
    }
}