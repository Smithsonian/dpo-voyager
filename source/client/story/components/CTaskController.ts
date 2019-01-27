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
import CController, { Commander, Actions } from "@ff/graph/components/CController";
import CSelection, { IComponentEvent } from "@ff/graph/components/CSelection";

import CTask from "./CTask";

////////////////////////////////////////////////////////////////////////////////

export interface IActiveTaskEvent extends ITypedEvent<"active-task">
{
    previous: CTask;
    next: CTask;
}

export type TaskActions = Actions<CTaskController>;

export default class CTaskController extends CController<CTaskController>
{
    static readonly type: string = "CTaskController";

    private _taskNode: Node = null;
    private _tasks: CTask[] = [];
    private _activeTask: CTask = null;

    constructor(id: string)
    {
        super(id);
        this.addEvent("task");
    }

    get activeTask() {
        return this._activeTask;
    }

    set activeTask(task: CTask) {
        if (task !== this._activeTask) {

            const previous = this._activeTask;
            this._activeTask = task;

            if (previous) {
                previous.deactivate();
            }

            this.emit<IActiveTaskEvent>({ type: "active-task", previous, next: task });

            if (task) {
                task.activate();
            }
        }
    }

    setTaskTypes(taskTypes: Array<typeof CTask>) {
        this.activeTask = null;

        if (this._tasks) {
            this._tasks.forEach(task => task.dispose());
        }

        this._tasks = taskTypes.map(Type => this._taskNode.createComponent(Type));
        this.activeTask = this._tasks[0];
    }

    get tasks() {
        return this._tasks;
    }

    protected get selection() {
        return this.system.components.safeGet(CSelection);
    }

    createActions(commander: Commander)
    {
        return {};
    }

    create()
    {
        super.create();
        this._taskNode = this.graph.createNode("Tasks");
        this.selection.selectedComponents.on(CTask, this.onSelectTask, this);
    }

    dispose()
    {
        this.selection.selectedComponents.off(CTask, this.onSelectTask, this);
        super.dispose();
    }

    protected onSelectTask(event: IComponentEvent<CTask>)
    {
        if (event.add) {
            this.activeTask = event.component;
        }
    }
}