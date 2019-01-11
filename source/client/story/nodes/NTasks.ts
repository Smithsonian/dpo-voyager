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
import CTask from "../components/CTask";

import CPoseTask from "../components/CPoseTask";
import CCaptureTask from "../components/CCaptureTask";

////////////////////////////////////////////////////////////////////////////////

export interface ITaskChangeEvent extends ITypedEvent<"task">
{
    previous: CTask;
    next: CTask;
}

export default class NTasks extends Node
{
    static readonly type: string = "NTasks";

    private _activeTaskIndex = -1;

    get tasks(): CTask[] {
        return this.components.getArray(CTask);
    }

    get activeTask(): CTask {
        return this.tasks[this._activeTaskIndex];
    }

    set activeTask(task: CTask) {
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
        this.createComponent(CPoseTask);
        this.createComponent(CCaptureTask);
    }
}