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
import { IButtonClickEvent } from "@ff/ui/Button";

import TaskController from "../controllers/TaskController";
import Task from "../tasks/Task";
import SettingsTask from "../tasks/SettingsTask";
import InspectionTask from "../tasks/InspectionTask";
import PoseTask from "../tasks/PoseTask";
import AnnotationsTask from "../tasks/AnnotationsTask";
import ToursTask from "../tasks/ToursTask";
import DocumentsTask from "../tasks/DocumentsTask";

import CustomElement, { customElement, property, html } from "@ff/ui/CustomElement";

////////////////////////////////////////////////////////////////////////////////

@customElement("sv-task-bar")
export default class TaskBar extends CustomElement
{
    @property({ attribute: false })
    controller: TaskController;

    protected tasks: Task[];

    constructor(controller?: TaskController)
    {
        super();
        this.controller = controller;

        this.tasks = [
            new SettingsTask(),
            new InspectionTask(),
            new PoseTask(),
            new AnnotationsTask(),
            new ToursTask(),
            new DocumentsTask(),
        ];
    }

    firstConnected()
    {

    }

    render()
    {
        const tasks = this.tasks;

        return html`
            <img class="sv-logo" src="/images/voyager-75grey.svg" alt="Logo"/>
            <div class="sv-spacer"></div>
            <div class="sv-divider"></div>
            <ff-flex-row @click=${this.onClickTask}>
                ${tasks.map(task => html`<ff-button text=${task.text} icon=${task.icon}></ff-button>`)}
            </ff-flex-row>
            <ff-flex-row @click=${this.onClickTask}>
                <div class="sv-divider"></div>
                <ff-button text="Expert Mode" icon="fa fa-code"></ff-button>
                <div class="sv-divider"></div>
                <ff-button text="Save" icon="fa fa-save"></ff-button>
                <ff-button text="Exit" icon="fa fa-sign-out-alt"></ff-button>
            </ff-flex-row>
        `;
    }

    protected onClickTask(event: MouseEvent)
    {

    }
}