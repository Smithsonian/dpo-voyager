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

import { customElement, property, html } from "@ff/ui/CustomElement";
import "@ff/ui/Layout";
import "@ff/ui/Splitter";
import "@ff/ui/Button";
import "@ff/ui/IndexButton";
import { IButtonClickEvent } from "@ff/ui/Button";

import VoyagerScene from "../../core/components/VoyagerScene";
import Model from "../../core/components/Model";

import PoseTask, { EPoseManipMode } from "../components/PoseTask";

import "./ItemList";
import "./PropertyView";
import ItemProperties from "./ItemProperties";
import TaskView from "./TaskView";

////////////////////////////////////////////////////////////////////////////////

@customElement("sv-pose-task-view")
export default class PoseTaskView extends TaskView
{
    protected firstConnected()
    {
        super.firstConnected();

        this.setStyle({
            display: "flex",
            flexDirection: "column"
        });

        this.classList.add("sv-pose-task-view");
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
                <sv-pose-task-property-view .system=${system} .task=${this.task}></sv-pose-task-property-view>
            </div>
        `;
    }
}

////////////////////////////////////////////////////////////////////////////////

@customElement("sv-pose-task-property-view")
class PoseTaskPropertyView extends ItemProperties<Model>
{
    @property({ attribute: false })
    task: PoseTask = null;

    protected scene: VoyagerScene = null;

    constructor()
    {
        super(Model);
    }

    protected connected()
    {
        super.connected();
        this.task.ins.mode.on("value", this.onModeChange, this);
    }

    protected disconnected()
    {
        super.disconnected();
        this.task.ins.mode.off("value", this.onModeChange, this);
    }

    protected render()
    {
        const model = this.component;

        if (!model) {
            return html``;
        }

        const mode = this.task.ins.mode.value;

        const globalUnits = this.scene.ins.units;
        const itemUnits = model.ins.units;
        const position = model.ins.position;
        const rotation = model.ins.rotation;

        return html`
            <ff-flex-row wrap>
                <ff-index-button text="Rotate" index=${EPoseManipMode.Rotate} selectedIndex=${mode} @click=${this.onClickMode}></ff-index-button>
                <ff-index-button text="Move" index=${EPoseManipMode.Translate} selectedIndex=${mode} @click=${this.onClickMode}></ff-index-button>
                <ff-button text="Center" @click=${this.onClickCenter}></ff-button>
                <ff-button text="Zoom Views" @click=${this.onClickZoomViews}></ff-button>
            </ff-flex-row>
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
        this.component.ins.center.set();
    }

    protected onClickZoomViews()
    {
        this.scene.zoomViews();
    }

    protected setComponent(model: Model)
    {
        if (model) {
            this.scene = model.transform.getParent(VoyagerScene, true);

            const prop = this.task.ins.mode;
            if (prop.value === EPoseManipMode.Off) {
                prop.setValue(EPoseManipMode.Rotate);
            }
        }
        else {
            this.scene = null;
        }

        super.setComponent(model);
    }

    protected onModeChange()
    {
        this.requestUpdate();
    }
}