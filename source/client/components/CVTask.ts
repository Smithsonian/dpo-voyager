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

import { types } from "@ff/graph/Component";
import CPickSelection from "@ff/scene/components/CPickSelection";

import CVNodeObserver from "./CVNodeObserver";
import CVDocument from "./CVDocument";

import NodeView, { customElement, property, html } from "../ui/explorer/NodeView";

////////////////////////////////////////////////////////////////////////////////

export { types, customElement, property, html };

/**
 * Base class for tasks in the Voyager Story authoring environment. A task provides a number of tools. The tools operate
 * in the context of the currently selected node or component.
 *
 * In order to be aware of the currently selected node, CVTask inherits from CVNodeObserver.
 */
export default class CVTask extends CVNodeObserver
{
    static readonly typeName: string = "CVTask";

    static readonly text: string = "Task";
    static readonly icon: string = "fa fa-tasks";

    protected static readonly taskIns = {
    };

    protected static readonly taskOuts = {
        isActive: types.Boolean("Task.IsActive"),
    };

    ins = this.addInputs(CVTask.taskIns);
    outs = this.addOutputs(CVTask.taskOuts);

    protected get selection() {
        return this.getMainComponent(CPickSelection);
    }
    protected get isActiveTask() {
        return this._isActiveTask;
    }

    private _isActiveTask = false;

    protected configuration = {
        bracketsVisible: undefined,
        interfaceVisible: undefined,
        gridVisible: undefined,
        annotationsVisible: undefined,
    };

    private _savedConfig = {
        bracketsVisible: undefined,
        interfaceVisible: undefined,
        gridVisible: undefined,
        annotationsVisible: undefined,
    };

    dispose()
    {
        if (this._isActiveTask) {
            this.deactivateTask();
        }

        super.dispose();
    }

    createView(): TaskView
    {
        throw new Error("must override");
    }

    /**
     * Called when the task is activated.
     */
    activateTask()
    {
        this._isActiveTask = true;

        this.outs.isActive.setValue(true);

        const configuration = this.configuration;
        const savedConfig = this._savedConfig;

        if (configuration.bracketsVisible !== undefined) {
            const prop = this.selection.ins.viewportBrackets;
            savedConfig.bracketsVisible = prop.value;
            prop.setValue(!!configuration.bracketsVisible);
        }
    }

    /**
     * Called when the task is deactivated.
     */
    deactivateTask()
    {
        const savedConfig = this._savedConfig;

        if (savedConfig.bracketsVisible !== undefined) {
            this.selection.ins.viewportBrackets.setValue(savedConfig.bracketsVisible);
        }

        this._isActiveTask = false;

        this.outs.isActive.setValue(false);
    }

    /**
     * Called when the currently active document changes.
     */
    protected onActiveDocument(previous: CVDocument, next: CVDocument)
    {
        const configuration = this.configuration;
        const savedConfig = this._savedConfig;

        if (previous) {
            if (savedConfig.gridVisible !== undefined) {
                previous.setup.grid.ins.visible.setValue(savedConfig.gridVisible);
            }
            if (savedConfig.annotationsVisible !== undefined) {
                previous.setup.viewer.ins.annotationsVisible.setValue(savedConfig.annotationsVisible);
            }
            if (savedConfig.interfaceVisible !== undefined) {
                previous.setup.interface.ins.visible.setValue(savedConfig.interfaceVisible);
            }
        }
        if (next) {
            if (configuration.gridVisible !== undefined) {
                const prop = next.setup.grid.ins.visible;
                savedConfig.gridVisible = prop.value;
                prop.setValue(!!configuration.gridVisible);
            }
            if (configuration.annotationsVisible !== undefined) {
                const prop = next.setup.viewer.ins.annotationsVisible;
                savedConfig.annotationsVisible = prop.value;
                prop.setValue(!!configuration.annotationsVisible);
            }
            if (configuration.interfaceVisible !== undefined) {
                const prop = next.setup.interface.ins.visible;
                savedConfig.interfaceVisible = prop.value;
                prop.setValue(!!configuration.interfaceVisible);
            }
        }
    }
}

////////////////////////////////////////////////////////////////////////////////

/**
 * Base class for task view components.
 */
export class TaskView<T extends CVTask = CVTask> extends NodeView
{
    @property({ attribute: false })
    task: T = null;

    constructor(task?: T)
    {
        super(task.system);
        this.task = task;
    }

    protected firstConnected()
    {
        this.classList.add("sv-task-view");
    }
}