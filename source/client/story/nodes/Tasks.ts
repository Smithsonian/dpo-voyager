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

import { ITypedEvent } from "@ff/core/Publisher";
import Node from "@ff/graph/Node";
import Task from "../components/Task";

import PoseTask from "../components/PoseTask";
import CaptureTask from "../components/CaptureTask";

////////////////////////////////////////////////////////////////////////////////

export interface ITaskChangeEvent extends ITypedEvent<"task">
{
    previous: Task;
    next: Task;
}

export default class Tasks extends Node
{
    static readonly type: string = "Tasks";

    private _activeTaskIndex = -1;

    get tasks(): Task[] {
        return this.components.getArray(Task);
    }

    get activeTask(): Task {
        return this.tasks[this._activeTaskIndex];
    }

    set activeTask(task: Task) {
        const index = this.tasks.indexOf(task);
        if (index < 0) {
            throw new Error("unregistered task");
        }

        this.activeTaskIndex = index;
    }

    get activeTaskIndex() {
        return this._activeTaskIndex;
    }

    set activeTaskIndex(index: number) {
        if (index !== this._activeTaskIndex) {

            const previous = this.activeTask;
            previous && previous.deactivate();

            this._activeTaskIndex = index;

            const next = this.activeTask;
            next && next.activate();

            this.emit<ITaskChangeEvent>({ type: "task", previous, next });
        }
    }

    createComponents()
    {
        this.createComponent(PoseTask);
        this.createComponent(CaptureTask);
    }
}