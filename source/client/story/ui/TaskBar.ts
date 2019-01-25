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

import CTaskController, { IActiveTaskEvent } from "../components/CTaskController";
import CStoryController from "../components/CStoryController";

import SystemElement, { customElement, html } from "./SystemElement";

////////////////////////////////////////////////////////////////////////////////

@customElement("sv-task-bar")
export default class TaskBar extends SystemElement
{
    protected tasks: CTaskController = null;
    protected story: CStoryController = null;

    constructor(system?: System)
    {
        super(system);

        this.tasks = system.graph.components.safeGet(CTaskController);
        this.story = system.graph.components.safeGet(CStoryController);
    }

    protected firstConnected()
    {
        this.classList.add("sv-task-bar");
    }

    protected connected()
    {
        this.tasks.on<IActiveTaskEvent>("active-task", this.onChange, this);
        this.story.ins.expertMode.on("value", this.onChange, this);
    }

    protected disconnected()
    {
        this.tasks.off<IActiveTaskEvent>("active-task", this.onChange, this);
        this.story.ins.expertMode.off("value", this.onChange, this);
    }

    protected render()
    {
        const taskList = this.tasks.tasks;
        const activeTask = this.tasks.activeTask;
        const expertMode = this.story.ins.expertMode.value;

        return html`
            <img class="sv-logo" src="images/voyager-75grey.svg" alt="Logo"/>
            <div class="sv-spacer"></div>
            <div class="sv-divider"></div>
            <div class="ff-flex-row ff-group" @click=${this.onClickTask}>
                ${taskList.map((task, index) => html`<ff-button text=${task.text} icon=${task.icon} index=${index} ?selected=${task === activeTask}></ff-button>`)}
            </div>
            <div class="sv-divider"></div>
            <div class="sv-spacer"></div>
            <div class="sv-divider"></div>
            <div class="ff-flex-row ff-group">
                <ff-button text="Upload" icon="upload" @click=${this.onClickUpload}></ff-button>
                <ff-button text="Download" icon="download" @click=${this.onClickDownload}></ff-button>
                <ff-button text="Exit" icon="exit" @click=${this.onClickExit}></ff-button>
                <div class="sv-divider"></div>
                <ff-button text="Expert Mode" icon="expert" ?selected=${expertMode} @click=${this.onClickExpertMode}></ff-button>
            </div>
        `;
    }

    protected onClickTask(event: IButtonClickEvent)
    {
        const taskList = this.tasks.tasks;

        if (event.target instanceof Button) {
            this.tasks.activeTask = taskList[event.target.index];
        }
    }

    protected onClickUpload()
    {
        this.story.ins.upload.set();
    }

    protected onClickDownload()
    {
        this.story.ins.download.set();
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