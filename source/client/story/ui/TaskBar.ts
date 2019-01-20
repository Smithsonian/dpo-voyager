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

import System from "@ff/graph/System";

import "@ff/ui/Button";
import Button, { IButtonClickEvent } from "@ff/ui/Button";

import NTasks, { ITaskChangeEvent } from "../nodes/NTasks";
import CStory from "../components/CStory";

import SystemElement, { customElement, html } from "./SystemElement";

////////////////////////////////////////////////////////////////////////////////

@customElement("sv-task-bar")
export default class TaskBar extends SystemElement
{
    protected tasks: NTasks = null;
    protected story: CStory = null;


    constructor(system?: System)
    {
        super(system);

        this.tasks = system.nodes.safeGet(NTasks);
        this.story = system.components.safeGet(CStory);
    }

    protected firstConnected()
    {
        this.classList.add("sv-task-bar");
    }

    protected connected()
    {
        this.tasks.on<ITaskChangeEvent>("task", this.onChange, this);
        this.story.ins.expertMode.on("value", this.onChange, this);
    }

    protected disconnected()
    {
        this.tasks.off<ITaskChangeEvent>("task", this.onChange, this);
        this.story.ins.expertMode.off("value", this.onChange, this);
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
            <div class="ff-flex-row ff-group" @click=${this.onClickTask}>
                ${taskList.map((task, index) => html`<ff-button text=${task.text} icon=${task.icon} index=${index} selectedIndex=${selectedIndex}></ff-button>`)}
            </div>
            <div class="sv-divider"></div>
            <div class="sv-spacer"></div>
            <div class="sv-divider"></div>
            <div class="ff-flex-row ff-group" @click=${this.onClickTask}>
                <ff-button text="Save" icon="save" @click=${this.onClickSave}></ff-button>
                <ff-button text="Exit" icon="exit" @click=${this.onClickExit}></ff-button>
                <div class="sv-divider"></div>
                <ff-button text="Expert Mode" icon="expert" ?selected=${expertMode} @click=${this.onClickExpertMode}></ff-button>
            </div>
        `;
    }

    protected onClickTask(event: IButtonClickEvent)
    {
        if (event.target instanceof Button) {
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

    protected onChange()
    {
        this.requestUpdate();
    }
}