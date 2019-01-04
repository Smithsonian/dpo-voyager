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

import StoryController, { ITaskChangeEvent } from "../controllers/StoryController";
import Task from "../tasks/Task";

import CustomElement, { customElement, property, html } from "@ff/ui/CustomElement";

////////////////////////////////////////////////////////////////////////////////

@customElement("sv-task-bar")
export default class TaskBar extends CustomElement
{
    @property({ attribute: false })
    controller: StoryController;

    protected tasks: Task[];

    constructor(controller?: StoryController)
    {
        super();
        this.controller = controller;
    }

    protected firstConnected()
    {
    }

    protected connected()
    {
        this.controller.on<ITaskChangeEvent>("change", this.onControllerChange, this);
    }

    protected disconnected()
    {
        this.controller.off<ITaskChangeEvent>("change", this.onControllerChange, this);
    }

    protected render()
    {
        const controller = this.controller;
        const tasks = controller.tasks;
        const selectedIndex = controller.activeTaskIndex;

        return html`
            <img class="sv-logo" src="images/voyager-75grey.svg" alt="Logo"/>
            <div class="sv-spacer"></div>
            <div class="sv-divider"></div>
            <ff-flex-row @click=${this.onClickTask}>
                ${tasks.map((task, index) => html`<ff-index-button text=${task.text} icon=${task.icon} index=${index} selectedIndex=${selectedIndex}></ff-index-button>`)}
            </ff-flex-row>
            <div class="sv-divider"></div>
            <div class="sv-spacer"></div>
            <div class="sv-divider"></div>
            <ff-flex-row @click=${this.onClickTask}>
                <ff-button text="Save" icon="fa fa-save" @click=${this.onClickSave}></ff-button>
                <ff-button text="Exit" icon="fa fa-sign-out-alt" @click=${this.onClickExit}></ff-button>
                <div class="sv-divider"></div>
                <ff-button text="Expert Mode" icon="fa fa-code" ?selected=${controller.expertMode} @click=${this.onClickExpertMode}></ff-button>
            </ff-flex-row>
        `;
    }

    protected onClickTask(event: IButtonClickEvent)
    {
        if (event.target instanceof IndexButton) {
            this.controller.activeTaskIndex = event.target.index;
        }
    }

    protected onClickSave()
    {
        this.controller.save();
    }

    protected onClickExit()
    {
        this.controller.exitApplication();
    }

    protected onClickExpertMode()
    {
        this.controller.toggleExpertMode();
    }

    protected onControllerChange()
    {
        this.requestUpdate();
    }
}