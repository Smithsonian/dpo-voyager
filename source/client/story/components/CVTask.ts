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

import NVNode from "../../explorer/nodes/NVNode";
import CVDocumentManager from "../../explorer/components/CVDocumentManager";
import CVDocument from "../../explorer/components/CVDocument";

import CustomElement, { customElement, property, html } from "@ff/ui/CustomElement";

////////////////////////////////////////////////////////////////////////////////

export { types, customElement, property, html };

export default class CVTask extends Component
{
    static readonly typeName: string = "CVTask";

    static readonly text: string = "Task";
    static readonly icon: string = "fa fa-tasks";

    protected static readonly taskIns = {
        activeDocument: types.Object("Task.ActiveDocument", CVDocument),
        activeNode: types.Object("Task.ActiveNode", NVNode),
    };

    protected static readonly taskOuts = {
    };

    ins = this.addInputs(CVTask.taskIns);
    outs = this.addOutputs(CVTask.taskOuts);

    protected get selection() {
        return this.system.getMainComponent(CPickSelection);
    }
    protected get documentManager() {
        return this.system.getMainComponent(CVDocumentManager);
    }
    protected get activeDocument() {
        return this._activeDocument;
    }
    protected get activeNode() {
        return this._activeNode;
    }
    protected get isActiveTask() {
        return this._isActiveTask;
    }

    private _isActiveTask = false;
    private _activeDocument: CVDocument = null;
    private _activeNode: NVNode = null;

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

    update(context)
    {
        const ins = this.ins;

        if (ins.activeDocument.changed) {
            const document = ins.activeDocument.value;
            if (document !== this._activeDocument) {
                this.onActiveDocument(this._activeDocument, document);
                this._activeDocument = document;
            }
        }

        if (ins.activeNode.changed) {
            const node = ins.activeNode.value;
            if (node !== this._activeNode) {
                this.onActiveNode(this._activeNode, node);
                this._activeNode = node;
            }
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
        this._isActiveTask = true;

        this.ins.activeDocument.linkFrom(this.documentManager.outs.activeDocument);
        this.ins.activeNode.linkFrom(this.documentManager.outs.activeNode);

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

        this.ins.activeDocument.unlinkFrom(this.documentManager.outs.activeDocument);
        this.ins.activeNode.unlinkFrom(this.documentManager.outs.activeNode);

        this._isActiveTask = false;
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
                previous.documentScene.grid.ins.visible.setValue(savedConfig.gridVisible);
            }
            if (savedConfig.annotationsVisible !== undefined) {
                previous.documentScene.annotations.ins.visible.setValue(savedConfig.annotationsVisible);
            }
            if (savedConfig.interfaceVisible !== undefined) {
                previous.documentScene.interface.ins.visible.setValue(savedConfig.interfaceVisible);
            }
        }
        if (next) {
            if (configuration.gridVisible !== undefined) {
                const prop = next.documentScene.grid.ins.visible;
                savedConfig.gridVisible = prop.value;
                prop.setValue(!!configuration.gridVisible);
            }
            if (configuration.annotationsVisible !== undefined) {
                const prop = next.documentScene.annotations.ins.visible;
                savedConfig.annotationsVisible = prop.value;
                prop.setValue(!!configuration.annotationsVisible);
            }
            if (configuration.interfaceVisible !== undefined) {
                const prop = next.documentScene.interface.ins.visible;
                savedConfig.interfaceVisible = prop.value;
                prop.setValue(!!configuration.interfaceVisible);
            }
        }
    }

    /**
     * Called when the currently active node changes.
     */
    protected onActiveNode(previous: NVNode, next: NVNode)
    {
    }
}

////////////////////////////////////////////////////////////////////////////////

export class TaskView<T extends CVTask = CVTask> extends CustomElement
{
    @property({ attribute: false })
    task: T = null;

    private _activeDocument: CVDocument = null;
    private _activeNode: NVNode = null;

    constructor(task?: T)
    {
        super();
        this.task = task;
    }

    protected get system() {
        return this.task.system;
    }
    protected get activeDocument() {
        return this._activeDocument;
    }
    protected get activeNode() {
        return this._activeNode;
    }

    protected firstConnected()
    {
        this.classList.add("sv-task-view");
    }

    protected connected()
    {
        const adProp = this.task.ins.activeDocument;
        adProp.on("value", this._onActiveDocument, this);
        this._onActiveDocument(adProp.value);

        const anProp = this.task.ins.activeNode;
        anProp.on("value", this._onActiveNode, this);
        this._onActiveNode(anProp.value);

        this.task.on("update", this.onRequestUpdate, this);
    }

    protected disconnected()
    {
        this.task.off("update", this.onRequestUpdate, this);

        const adProp = this.task.ins.activeDocument;
        adProp.off("value", this._onActiveDocument, this);
        this._onActiveDocument(null);

        const anProp = this.task.ins.activeNode;
        anProp.off("value", this._onActiveNode, this);
        this._onActiveNode(null);
    }

    protected onActiveDocument(previous: CVDocument, next: CVDocument)
    {
    }

    protected onActiveNode(previous: NVNode, next: NVNode)
    {
    }

    protected onRequestUpdate()
    {
        this.requestUpdate();
    }

    private _onActiveDocument(document: CVDocument)
    {
        this.onActiveDocument(this._activeDocument, document);
        this._activeDocument = document;
    }

    private _onActiveNode(node: NVNode)
    {
        this.onActiveNode(this._activeNode, node);
        this._activeNode = node;
    }
}