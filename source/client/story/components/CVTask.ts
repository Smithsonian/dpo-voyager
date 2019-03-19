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

import CPickSelection from "@ff/scene/components/CPickSelection";
import CVInterface from "../../explorer/components/CVInterface";

import CVDocumentManager from "../../explorer/components/CVDocumentManager";
import CVDocument_old from "../../explorer/components/CVDocument_old";
import CVItemManager from "../../explorer/components/CVItemManager";
import NVItem_old from "../../explorer/nodes/NVItem_old";

import CustomElement, { customElement, property, html } from "@ff/ui/CustomElement";

////////////////////////////////////////////////////////////////////////////////

export { types, customElement, property, html };

export default class CVTask extends Component
{
    static readonly typeName: string = "CVTask";

    static readonly text: string = "Task";
    static readonly icon: string = "fa fa-tasks";

    protected static readonly taskIns = {
        activeDocument: types.Object("Task.ActiveDocument", CVDocument_old),
        activeItem: types.Object("Task.ActiveItem", NVItem_old),
    };

    protected static readonly taskOuts = {
        updated: types.Event("Task.Updated"),
    };

    ins = this.addInputs(CVTask.taskIns);
    outs = this.addOutputs(CVTask.taskOuts);

    get interface() {
        return this.getMainComponent(CVInterface);
    }
    get selectionController() {
        return this.getMainComponent(CPickSelection);
    }
    get documentManager() {
        return this.getMainComponent(CVDocumentManager);
    }
    get itemManager() {
        return this.getMainComponent(CVItemManager);
    }

    protected isActiveTask = false;
    protected activeDocument: CVDocument_old = null;
    protected activeItem: NVItem_old = null;

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

    create()
    {
        this.documentManager.outs.activeDocument.linkTo(this.ins.activeDocument);
        this.itemManager.outs.activeItem.linkTo(this.ins.activeItem);
    }

    update()
    {
        if (!this.isActiveTask) {
            return false;
        }

        const ins = this.ins;

        if (ins.activeDocument.changed) {
            const activeDocument = ins.activeDocument.value as CVDocument_old;
            this.onActiveDocument(this.activeDocument, activeDocument);
            this.activeDocument = activeDocument;
        }

        if (ins.activeItem.changed) {
            const activeItem = ins.activeItem.value;
            this.onActiveItem(this.activeItem, activeItem);
            this.activeItem = activeItem;
        }

        return true;
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
        this.isActiveTask = true;

        const activeDocument = this.ins.activeDocument.value as CVDocument_old;
        if (activeDocument) {
            this.activeDocument = activeDocument;
            this.onActiveDocument(null, activeDocument);
        }

        const activeItem = this.ins.activeItem.value;
        if (activeItem) {
            this.activeItem = activeItem;
            this.onActiveItem(null, activeItem);
        }

        const configuration = this.configuration;
        const savedConfig = this._savedConfig;

        if (configuration.bracketsVisible !== undefined) {
            const prop = this.selectionController.ins.viewportBrackets;
            savedConfig.bracketsVisible = prop.value;
            prop.setValue(!!configuration.bracketsVisible);
        }
        if (configuration.interfaceVisible !== undefined) {
            const prop = this.interface.ins.visible;
            savedConfig.interfaceVisible = prop.value;
            prop.setValue(!!configuration.interfaceVisible);
        }
    }

    /**
     * Called when the task is deactivated.
     */
    deactivateTask()
    {
        const savedConfig = this._savedConfig;

        if (savedConfig.bracketsVisible !== undefined) {
            this.selectionController.ins.viewportBrackets.setValue(savedConfig.bracketsVisible);
        }
        if (savedConfig.interfaceVisible !== undefined) {
            this.interface.ins.visible.setValue(savedConfig.interfaceVisible);
        }

        if (this.activeDocument) {
            this.onActiveDocument(this.activeDocument, null);
            this.activeDocument = null;
        }
        if (this.activeItem) {
            this.onActiveItem(this.activeItem, null);
            this.activeItem = null;
        }

        this.isActiveTask = false;
    }

    /**
     * Called when the currently active document changes.
     */
    protected onActiveDocument(previous: CVDocument_old, next: CVDocument_old)
    {
        console.log("CVTask.onActiveDocument - %s", this.displayName);
        const configuration = this.configuration;
        const savedConfig = this._savedConfig;

        if (previous) {
            if (savedConfig.gridVisible !== undefined) {
                previous.features.grid.ins.visible.setValue(savedConfig.gridVisible);
            }
            if (savedConfig.annotationsVisible !== undefined) {
                previous.voyagerScene.ins.annotationsVisible.setValue(savedConfig.annotationsVisible);
            }
        }
        if (next) {
            if (configuration.gridVisible !== undefined) {
                const prop = next.features.grid.ins.visible;
                savedConfig.gridVisible = prop.value;
                prop.setValue(!!configuration.gridVisible);
            }
            if (configuration.annotationsVisible !== undefined) {
                const prop = next.voyagerScene.ins.annotationsVisible;
                savedConfig.annotationsVisible = prop.value;
                prop.setValue(!!configuration.annotationsVisible);
            }
        }
    }

    /**
     * Called when the currently active item changes.
     */
    protected onActiveItem(previous: NVItem_old, next: NVItem_old)
    {
    }
}

////////////////////////////////////////////////////////////////////////////////

export class TaskView<T extends CVTask = CVTask> extends CustomElement
{
    @property({ attribute: false })
    task: T = null;

    constructor(task?: T)
    {
        super();
        this.task = task;
    }

    protected get system() {
        return this.task.system;
    }
    protected get activeDocument() {
        return this.task.ins.activeDocument.value;
    }
    protected get activeItem() {
        return this.task.ins.activeItem.value;
    }

    protected firstConnected()
    {
        this.classList.add("sv-task-view");
    }

    protected connected()
    {
        this.task.on("update", this.performUpdate, this);
    }

    protected disconnected()
    {
        this.task.off("update", this.performUpdate, this);
    }
}