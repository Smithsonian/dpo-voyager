/**
 * 3D Foundation Project
 * Copyright 2024 Smithsonian Institution
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

import CComponentProvider, {
    EComponentScope,
    IActiveComponentEvent,
    IScopedComponentsEvent,
} from "@ff/graph/components/CComponentProvider";

import CVTask from "./CVTask";
import taskSets, { ETaskMode } from "../applications/taskSets";
import { DEFAULT_LANGUAGE, ELanguageStringType, ELanguageType } from "client/schema/common";
import CVLanguageManager from "./CVLanguageManager";

////////////////////////////////////////////////////////////////////////////////

export { ETaskMode };

export type IActiveTaskEvent = IActiveComponentEvent<CVTask>;
export type ITaskSetEvent = IScopedComponentsEvent;

/**
 * Manages available tasks and keeps track of the currently active task.
 * Follows selection: if a task component is selected, it becomes the active task.
 */
export default class CVTaskProvider extends CComponentProvider<CVTask>
{
    static readonly typeName: string = "CVTaskProvider";
    static readonly isSystemSingleton = true;
    static readonly componentType = CVTask;

    protected static readonly ins = {
        mode: types.Enum("Tasks.Mode", ETaskMode),
    };

    ins = this.addInputs(CVTaskProvider.ins);

    constructor(node: Node, id: string)
    {
        super(node, id);
        this.scope = EComponentScope.Node;
    }

    protected get languageManager() {
        return this.getSystemComponent(CVLanguageManager);
    }

    get expertMode() {
        return this.ins.mode.getValidatedValue() === ETaskMode.Expert;
    }

    update(context)
    {
        const ins = this.ins;
        const languageManager = this.languageManager;

        if (ins.mode.changed) {
            this.scopedComponents.forEach(task => task.dispose());

            const taskSet = taskSets[ins.mode.getValidatedValue()];
            taskSet.forEach(taskType => this.createComponent(taskType));
        }

        return true;
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