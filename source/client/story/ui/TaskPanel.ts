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

import RenderSystem from "@ff/scene/RenderSystem";
import SystemElement, { customElement, html } from "./SystemElement";

import NTasks, { ITaskChangeEvent } from "../nodes/NTasks";

////////////////////////////////////////////////////////////////////////////////

@customElement("sv-task-panel")
export default class TaskPanel extends SystemElement
{
    protected tasks: NTasks = null;

    constructor(system?: RenderSystem)
    {
        super(system);

        this.tasks = system.nodes.get(NTasks);

        if (!this.tasks) {
            throw new Error("missing 'Tasks' node");
        }
    }

    protected firstConnected()
    {
        this.classList.add("sv-scrollable", "sv-panel", "sv-task-panel");
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
        const task = this.tasks.activeTask;
        if (!task) {
            return html``;
        }

        const iconClasses = "ff-icon " + task.icon;
        const viewElement = task.createView();

        return html`
            <div class="ff-header">
                <div class=${iconClasses}></div>
                <div class="ff-text">${task.text}</div>
            </div>
            <div class="ff-content">
                ${viewElement}
            </div>
        `;
    }

    protected onTaskChange()
    {
        this.requestUpdate();
    }
}