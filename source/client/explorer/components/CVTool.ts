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

import CDocumentManager from "@ff/graph/components/CDocumentManager";
import CDocument from "@ff/graph/components/CDocument";

import CVItemManager from "../../explorer/components/CVItemManager";
import NVItem from "../../explorer/nodes/NVItem";

import CustomElement, { customElement, property, html } from "@ff/ui/CustomElement";
import CVDocument from "./CVDocument";

////////////////////////////////////////////////////////////////////////////////

export { types, customElement, html };

export default class CVTool extends Component
{
    static readonly typeName: string = "CVTool";

    protected static readonly toolIns = {
        activeDocument: types.Object("Tool.ActiveDocument", CDocument),
        activeItem: types.Object("Tool.ActiveItem", NVItem),
    };

    protected static readonly toolOuts = {
    };

    ins = this.addInputs(CVTool.toolIns);
    outs = this.addOutputs(CVTool.toolOuts);

    get documentManager() {
        return this.system.getMainComponent(CDocumentManager);
    }
    get itemManager() {
        return this.getMainComponent(CVItemManager);
    }

    protected isActiveTool = false;
    protected activeDocument: CVDocument = null;
    protected activeItem: NVItem = null;

    create()
    {
        this.documentManager.outs.activeDocument.linkTo(this.ins.activeDocument);
        this.itemManager.outs.activeItem.linkTo(this.ins.activeItem);
    }

    update()
    {
        if (!this.isActiveTool) {
            return false;
        }

        const ins = this.ins;

        if (ins.activeDocument.changed) {
            const activeDocument = ins.activeDocument.value as CVDocument;
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

    createView(): ToolView
    {
        throw new Error("must override");
    }

    /**
     * Called when the tool is activated.
     */
    activateTool()
    {
        this.isActiveTool = true;

        const activeDocument = this.ins.activeDocument.value as CVDocument;
        if (activeDocument) {
            this.activeDocument = activeDocument;
            this.onActiveDocument(null, activeDocument);
        }

        const activeItem = this.ins.activeItem.value;
        if (activeItem) {
            this.activeItem = activeItem;
            this.onActiveItem(null, activeItem);
        }
    }

    /**
     * Called when the tool is deactivated.
     */
    deactivateTool()
    {
        if (this.activeDocument) {
            this.onActiveDocument(this.activeDocument, null);
            this.activeDocument = null;
        }
        if (this.activeItem) {
            this.onActiveItem(this.activeItem, null);
            this.activeItem = null;
        }

        this.isActiveTool = false;
    }

    /**
     * Called when the currently active document changes.
     */
    protected onActiveDocument(previous: CVDocument, next: CVDocument)
    {
    }

    /**
     * Called when the currently active item changes.
     */
    protected onActiveItem(previous: NVItem, next: NVItem)
    {
    }
}

////////////////////////////////////////////////////////////////////////////////

export class ToolView<T extends CVTool = CVTool> extends CustomElement
{
    @property({ attribute: false })
    tool: T = null;

    constructor(tool?: T)
    {
        super();
        this.tool = tool;
    }

    protected get system() {
        return this.tool.system;
    }
    protected get activeDocument() {
        return this.tool.ins.activeDocument.value;
    }
    protected get activeItem() {
        return this.tool.ins.activeItem.value;
    }

    protected firstConnected()
    {
        this.classList.add("sv-tool-view");
    }

    protected connected()
    {
        this.tool.on("update", this.performUpdate, this);
    }

    protected disconnected()
    {
        this.tool.off("update", this.performUpdate, this);
    }
}