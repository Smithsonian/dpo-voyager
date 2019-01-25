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

import SystemElement, { customElement, html } from "./SystemElement";

import CTaskController, { IActiveTaskEvent } from "../components/CTaskController";

////////////////////////////////////////////////////////////////////////////////

@customElement("sv-task-panel")
export default class TaskPanel extends SystemElement
{
    protected taskController: CTaskController = null;

    constructor(system?: System)
    {
        super(system);

        this.taskController = system.graph.components.safeGet(CTaskController);

        if (!this.taskController) {
            throw new Error("missing task manager");
        }
    }

    protected firstConnected()
    {
        this.classList.add("sv-scrollable", "sv-panel", "sv-task-panel");
    }

    protected connected()
    {
        this.taskController.on<IActiveTaskEvent>("active-task", this.onActiveTask, this);
    }

    protected disconnected()
    {
        this.taskController.off<IActiveTaskEvent>("active-task", this.onActiveTask, this);
    }

    protected render()
    {
        const task = this.taskController.activeTask;
        if (!task) {
            return html``;
        }

        const viewElement = task.createView();

        return html`
            <div class="sv-panel-header">
                <ff-icon name=${task.icon}></ff-icon>
                <div class="ff-text">${task.text}</div>
            </div>
            <div class="sv-panel-content">
                ${viewElement}
            </div>
        `;
    }

    protected onActiveTask()
    {
        this.requestUpdate();
    }
}