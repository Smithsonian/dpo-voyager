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

import SystemElement, { customElement, html } from "../../core/ui/SystemElement";

import CVTaskManager from "../components/CVTaskManager";

////////////////////////////////////////////////////////////////////////////////

/**
 * Panel displaying the user interface for the currently active task.
 */
@customElement("sv-task-panel")
export default class TaskPanel extends SystemElement
{
    protected taskManager: CVTaskManager = null;

    constructor(system?: System)
    {
        super(system);

        this.taskManager = system.getMainComponent(CVTaskManager);

        if (!this.taskManager) {
            throw new Error("missing task manager");
        }
    }

    protected firstConnected()
    {
        this.classList.add("sv-scrollable", "sv-panel", "sv-task-panel");
    }

    protected connected()
    {
        super.connected();
        this.taskManager.outs.activeTask.on("value", this.performUpdate, this);
    }

    protected disconnected()
    {
        this.taskManager.outs.activeTask.off("value", this.performUpdate, this);
        super.disconnected();
    }

    protected render()
    {
        const task = this.taskManager.activeTask;
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
}