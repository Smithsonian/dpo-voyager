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

import NVNode from "../nodes/NVNode";
import CVDocumentManager from "./CVDocumentManager";
import CVDocument from "./CVDocument";

import CustomElement, { customElement, property, html } from "@ff/ui/CustomElement";

////////////////////////////////////////////////////////////////////////////////

export { types, customElement, property, html };

export default class CVTool extends Component
{
    static readonly typeName: string = "CVTool";

    protected static readonly toolIns = {
        activeDocument: types.Object("Tool.ActiveDocument", CVDocument),
        activeNode: types.Object("Tool.ActiveNode", NVNode),
    };

    protected static readonly toolOuts = {
    };

    ins = this.addInputs(CVTool.toolIns);
    outs = this.addOutputs(CVTool.toolOuts);

    protected get documentManager() {
        return this.system.getMainComponent(CVDocumentManager);
    }
    protected get activeDocument() {
        return this._activeDocument;
    }
    protected get activeNode() {
        return this._activeNode;
    }
    protected get isActiveTool() {
        return this._isActiveTool;
    }

    private _isActiveTool = false;
    private _activeDocument: CVDocument = null;
    private _activeNode: NVNode = null;

    dispose()
    {
        if (this._isActiveTool) {
            this.deactivateTool();
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

    createView(): ToolView
    {
        throw new Error("must override");
    }

    /**
     * Called when the tool is activated.
     */
    activateTool()
    {
        this._isActiveTool = true;

        this.ins.activeDocument.linkFrom(this.documentManager.outs.activeDocument);
        this.ins.activeNode.linkFrom(this.documentManager.outs.activeNode);
    }

    /**
     * Called when the tool is deactivated.
     */
    deactivateTool()
    {
        this.ins.activeDocument.unlinkFrom(this.documentManager.outs.activeDocument);
        this.ins.activeNode.unlinkFrom(this.documentManager.outs.activeNode);

        this._isActiveTool = false;
    }

    protected onActiveDocument(previous: CVDocument, next: CVDocument)
    {
    }

    protected onActiveNode(previous: NVNode, next: NVNode)
    {
    }
}

////////////////////////////////////////////////////////////////////////////////

export class ToolView<T extends CVTool = CVTool> extends CustomElement
{
    @property({ attribute: false })
    tool: T = null;

    private _activeDocument: CVDocument = null;
    private _activeNode: NVNode = null;

    constructor(tool?: T)
    {
        super();
        this.tool = tool;
    }

    protected get system() {
        return this.tool.system;
    }
    protected get activeDocument() {
        return this._activeDocument;
    }
    protected get activeNode() {
        return this._activeNode;
    }

    protected firstConnected()
    {
        this.classList.add("sv-tool-view");
    }

    protected connected()
    {
        const adProp = this.tool.ins.activeDocument;
        adProp.on("value", this._onActiveDocument, this);
        this._onActiveDocument(adProp.value);

        const anProp = this.tool.ins.activeNode;
        anProp.on("value", this._onActiveNode, this);
        this._onActiveNode(anProp.value);

        this.tool.on("update", this.onRequestUpdate, this);
    }

    protected disconnected()
    {
        this.tool.off("update", this.onRequestUpdate, this);

        const adProp = this.tool.ins.activeDocument;
        adProp.off("value", this._onActiveDocument, this);
        this._onActiveDocument(null);

        const anProp = this.tool.ins.activeNode;
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