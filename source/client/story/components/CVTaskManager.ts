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

import Component, { types } from "@ff/graph/Component";

import CVTask from "./CVTask";

////////////////////////////////////////////////////////////////////////////////


/**
 * Manages available tasks and keeps track of the currently active task.
 * Follows selection: if a task component is selected, it becomes the active task.
 */
export default class CVTaskManager extends Component
{
    static readonly typeName: string = "CVTaskManager";
    static readonly isSystemSingleton = true;

    protected static readonly ins = {
        activeTask: types.Option("Tasks.ActiveTask", []),
    };

    protected static readonly outs = {
        activeTask: types.Object("Tasks.ActiveTask", CVTask),
        changedTasks: types.Event("Tasks.Changed"),
    };

    ins = this.addInputs(CVTaskManager.ins);
    outs = this.addOutputs(CVTaskManager.outs);

    get tasks() {
        return this.getComponents(CVTask);
    }
    get activeTask() {
        return this.outs.activeTask.value;
    }
    set activeTask(task: CVTask) {
        const activeTask = this.activeTask;

        if (task !== activeTask) {

            if (activeTask) {
                activeTask.deactivateTask();
            }
            if (task) {
                task.activateTask();
            }

            this.outs.activeTask.setValue(task);

            const index = this.tasks.indexOf(task);
            this.ins.activeTask.setValue(index + 1);
        }
    }

    create()
    {
        this.components.on(CVTask, this.updateTasks, this);
    }

    update()
    {
        const ins = this.ins;

        if (ins.activeTask.changed) {
            const index = ins.activeTask.getValidatedValue() - 1;
            this.activeTask = index >= 0 ? this.tasks[index] : null;
        }

        return true;
    }

    dispose()
    {
        this.components.off(CVTask, this.updateTasks, this);
        super.dispose();
    }

    protected updateTasks()
    {
        const tasks = this.tasks;
        const names = tasks.map(task => task.displayName);
        names.unshift("(none)");
        this.ins.activeTask.setOptions(names);

        let activeTask = this.activeTask;

        const index = activeTask ?
            tasks.indexOf(activeTask) :
            Math.min(1, tasks.length);

        if (index !== this.ins.activeTask.getValidatedValue()) {
            this.ins.activeTask.setValue(index);
        }

        this.outs.changedTasks.set();
    }
}