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

import CComponentProvider, {
    EComponentScope,
    IActiveComponentEvent
} from "@ff/graph/components/CComponentProvider";

import CVTask from "./CVTask";

////////////////////////////////////////////////////////////////////////////////

export type IActiveTaskEvent = IActiveComponentEvent<CVTask>;

/**
 * Manages available tasks and keeps track of the currently active task.
 * Follows selection: if a task component is selected, it becomes the active task.
 */
export default class CVTaskProvider extends CComponentProvider<CVTask>
{
    static readonly typeName: string = "CVTaskProvider";
    static readonly isSystemSingleton = true;
    static readonly componentType = CVTask;

    create()
    {
        super.create();
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