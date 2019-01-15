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
import Component from "@ff/graph/Component";
import CSelection from "@ff/graph/components/CSelection";

import TaskView from "../ui/TaskView";

import NTasks from "../nodes/NTasks";

////////////////////////////////////////////////////////////////////////////////

const ins = {
    activate: types.Event("Activate")
};

export default class CTask extends Component
{
    static readonly type: string = "CTask";

    static readonly text: string = "Task";
    static readonly icon: string = "fa fa-tasks";

    ins = this.addInputs(ins);

    protected selection: CSelection = null;

    create()
    {
        this.selection = this.system.components.safeGet(CSelection);
    }

    update()
    {
        if (this.ins.activate.changed) {
            const tasksNode = this.node as NTasks;
            tasksNode.activeTask = this;
        }

        return false;
    }

    get text() {
        return (this.constructor as typeof CTask).text;
    }
    get icon() {
        return (this.constructor as typeof CTask).icon
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