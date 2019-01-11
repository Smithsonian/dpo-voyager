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

import ExplorerComponent from "../../explorer/ExplorerComponent";
import TaskView from "../ui/TaskView";

////////////////////////////////////////////////////////////////////////////////

export default class Task extends ExplorerComponent
{
    static readonly type: string = "Task";

    static readonly text: string = "Task";
    static readonly icon: string = "fa fa-tasks";

    ins = this.ins.append({
        activate: types.Event("Activate")
    });

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

    protected activate()
    {
    }

    protected deactivate()
    {
    }
}