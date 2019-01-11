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

import { types } from "@ff/graph/propertyTypes";
import CSelection from "@ff/graph/components/CSelection";
import RenderComponent from "@ff/scene/RenderComponent";

import TaskView from "../ui/TaskView";

import Tasks from "../nodes/Tasks";

////////////////////////////////////////////////////////////////////////////////

export default class Task extends RenderComponent
{
    static readonly type: string = "Task";

    static readonly text: string = "Task";
    static readonly icon: string = "fa fa-tasks";

    ins = this.ins.append({
        activate: types.Event("Activate")
    });

    protected selection: CSelection = null;

    create()
    {
        this.selection = this.system.components.safeGet(CSelection);
    }

    update()
    {
        if (this.ins.activate.changed) {
            const tasksNode = this.node as Tasks;
            tasksNode.activeTask = this;
        }

        return false;
    }

    get text() {
        return (this.constructor as typeof Task).text;
    }
    get icon() {
        return (this.constructor as typeof Task).icon
    }

    createView(): TaskView
    {
        throw new Error("must override");
    }

    activate()
    {
    }

    deactivate()
    {
    }
}