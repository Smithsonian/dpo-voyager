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

import TaskController, { ITaskChangeEvent } from "../controllers/TaskController";
import CustomElement, { customElement, property, html } from "@ff/ui/CustomElement";

////////////////////////////////////////////////////////////////////////////////

@customElement("sv-task-panel")
export default class TaskPanel extends CustomElement
{
    @property({ attribute: false })
    controller: TaskController;

    constructor(controller?: TaskController)
    {
        super();
        this.controller = controller;
    }

    protected firstConnected()
    {
        this.classList.add("sv-scrollable", "sv-panel", "sv-task-panel");
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
        const task = this.controller.activeTask;
        const iconClasses = "ff-icon " + task.icon;
        const editorElement = task.createEditor();

        return html`
            <div class="ff-header">
                <div class=${iconClasses}></div>
                <div class="ff-text">${task.text}</div>
            </div>
            <div class="ff-content">
                ${editorElement}
            </div>
        `;
    }

    protected onControllerChange()
    {
        this.requestUpdate();
    }
}