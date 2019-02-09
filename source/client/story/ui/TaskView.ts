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

import CustomElement from "@ff/ui/CustomElement";
import CVTask, { ITaskUpdateEvent } from "../components/CVTask";

////////////////////////////////////////////////////////////////////////////////

export default class TaskView extends CustomElement
{
    protected task: CVTask;

    constructor(task: CVTask)
    {
        super();
        this.task = task;
    }

    protected get system() {
        return this.task.system;
    }

    protected firstConnected()
    {
        this.classList.add("sv-task-view");
    }

    protected connected()
    {
        this.task.on<ITaskUpdateEvent>("update", this.onTaskUpdate, this);
    }

    protected disconnected()
    {
        this.task.on<ITaskUpdateEvent>("update", this.onTaskUpdate, this);
    }

    protected onTaskUpdate(event: ITaskUpdateEvent)
    {
        this.performUpdate();
    }
}