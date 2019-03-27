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

import { Node, types } from "@ff/graph/Component";
import CComponentProvider, { EComponentScope } from "@ff/graph/components/CComponentProvider";

import CVTask from "./CVTask";

////////////////////////////////////////////////////////////////////////////////

export default class CVActiveTask extends CComponentProvider<CVTask>
{
    static readonly typeName: string = "CVActiveTask";
    static readonly componentType = CVTask;

    constructor(node: Node, id: string)
    {
        super(node, id);

        this.scope = EComponentScope.Node;
    }

    protected activateComponent(task: CVTask)
    {
        task.activateTask();
    }

    protected deactivateComponent(task: CVTask)
    {
        task.deactivateTask();
    }

    protected onActiveComponent(previous: CVTask, next: CVTask)
    {
    }
}