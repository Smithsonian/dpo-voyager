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

import "@ff/ui/Layout";
import "@ff/ui/Button";

import IndexButton, { IButtonClickEvent } from "@ff/ui/IndexButton";

import ExplorerSystem from "../../explorer/ExplorerSystem";

import Tasks, { ITaskChangeEvent } from "../nodes/Tasks";
import Story from "../components/Story";

import CustomElement, { customElement, property, html } from "@ff/ui/CustomElement";

////////////////////////////////////////////////////////////////////////////////

@customElement("sv-task-bar")
export default class TaskBar extends CustomElement
{
    @property({ attribute: false })
    system: ExplorerSystem;

    protected tasks: Tasks = null;
    protected story: Story = null;


    constructor(system?: ExplorerSystem)
    {
        super();

        this.system = system;

        this.tasks = system.nodes.safeGet(Tasks);
        this.story = system.components.safeGet(Story);
    }

    protected firstConnected()
    {
        this.classList.add("sv-task-bar");
    }

    protected connected()
    {
        this.tasks.on<ITaskChangeEvent>("task", this.onTaskChange, this);
    }

    protected disconnected()
    {
        this.tasks.off<ITaskChangeEvent>("task", this.onTaskChange, this);
    }

    protected render()
    {
        const taskList = this.tasks.tasks;
        const selectedIndex = this.tasks.activeTaskIndex;
        const expertMode = this.story.ins.expertMode.value;

        return html`
            <img class="sv-logo" src="images/voyager-75grey.svg" alt="Logo"/>
            <div class="sv-spacer"></div>
            <div class="sv-divider"></div>
            <ff-flex-row @click=${this.onClickTask}>
                ${taskList.map((task, index) => html`<ff-index-button text=${task.text} icon=${task.icon} index=${index} selectedIndex=${selectedIndex}></ff-index-button>`)}
            </ff-flex-row>
            <div class="sv-divider"></div>
            <div class="sv-spacer"></div>
            <div class="sv-divider"></div>
            <ff-flex-row @click=${this.onClickTask}>
                <ff-button text="Save" icon="fa fa-save" @click=${this.onClickSave}></ff-button>
                <ff-button text="Exit" icon="fa fa-sign-out-alt" @click=${this.onClickExit}></ff-button>
                <div class="sv-divider"></div>
                <ff-button text="Expert Mode" icon="fa fa-code" ?selected=${expertMode} @click=${this.onClickExpertMode}></ff-button>
            </ff-flex-row>
        `;
    }

    protected onClickTask(event: IButtonClickEvent)
    {
        if (event.target instanceof IndexButton) {
            this.tasks.activeTaskIndex = event.target.index;
        }
    }

    protected onClickSave()
    {
        this.story.ins.save.set();
    }

    protected onClickExit()
    {
        this.story.ins.exit.set();
    }

    protected onClickExpertMode()
    {
        const prop = this.story.ins.expertMode;
        prop.setValue(!prop.value);
    }

    protected onTaskChange()
    {
        this.requestUpdate();
    }
}