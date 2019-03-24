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
import CSelection, { IComponentEvent, INodeEvent } from "@ff/graph/components/CSelection";

import NVNode from "../nodes/NVNode";
import CVDocument from "./CVDocument";

////////////////////////////////////////////////////////////////////////////////

/**
 * Manages a set of [[CVDocument]] components. One document at a time is the active document.
 * Selection of a [[CVDocument]], or selection of an inner [[NVNode]] of a [[CVDocument]] makes
 * the document the active document.
 */
export default class CVDocumentManager extends Component
{
    static readonly typeName: string = "CVDocumentManager";
    static readonly isSystemSingleton = true;

    protected static readonly ins = {
    };

    protected static readonly outs = {
        activeDocument: types.Object("Documents.ActiveDocument", CVDocument),
        changedDocuments: types.Event("Documents.Changed"),
        activeNode: types.Object("Nodes.ActiveNode", NVNode),
        changedNodes: types.Event("Nodes.Changed"),
    };

    ins = this.addInputs(CVDocumentManager.ins);
    outs = this.addOutputs(CVDocumentManager.outs);

    get documents() {
        return this.getComponents(CVDocument);
    }
    get activeDocument() {
        return this.outs.activeDocument.value;
    }
    set activeDocument(document: CVDocument) {
        const activeDocument = this.activeDocument;

        if (document !== activeDocument) {

            if (activeDocument) {
                activeDocument.ins.visible.setValue(false);
                activeDocument.ins.active.setValue(false);
            }
            if (document) {
                document.ins.visible.setValue(true);
                document.ins.active.setValue(true);
            }

            this.outs.activeDocument.setValue(document);

            const activeNode = this.activeNode;
            if (activeNode && activeNode.graph.parent !== document) {
                this.outs.activeNode.setValue(null);
            }

            this.outs.changedNodes.set();
        }
    }
    get activeNode() {
        return this.outs.activeNode.value;
    }
    set activeNode(node: NVNode) {
        const activeNode = this.activeNode;

        if (node !== activeNode) {
            if (node) {
                const document = node.graph.parent;
                if (document && document.is(CVDocument)) {
                    this.activeDocument = document as CVDocument;
                }
            }

            this.outs.activeNode.setValue(node);
        }
    }

    protected get selection() {
        return this.getMainComponent(CSelection);
    }

    create()
    {
        super.create();

        this.selection.selectedComponents.on(CVDocument, this.onSelectDocument, this);
        this.selection.selectedNodes.on(NVNode, this.onSelectNode, this);

        this.components.on(CVDocument, this.onDocument, this);
        this.system.nodes.on(NVNode, this.onNode, this);
    }

    dispose()
    {
        this.selection.selectedComponents.off(CVDocument, this.onSelectDocument, this);
        this.selection.selectedNodes.off(NVNode, this.onSelectNode, this);

        this.components.off(CVDocument, this.onDocument, this);
        this.system.nodes.off(NVNode, this.onNode, this);

        super.dispose();
    }

    protected onDocument(event: IComponentEvent<CVDocument>)
    {
        if (event.remove && event.object === this.activeDocument) {
            this.activeDocument = null;
        }

        this.outs.changedDocuments.set();
    }

    protected onSelectDocument(event: IComponentEvent<CVDocument>)
    {
        if (event.add) {
            this.activeDocument = event.object;
        }
    }

    protected onNode(event: INodeEvent<NVNode>)
    {
        if (event.remove && event.object === this.activeNode) {
            this.activeNode = null;
        }

        const document = event.object.graph.parent;
        if (document && document === this.activeDocument) {
            this.outs.changedNodes.set();
        }
    }

    protected onSelectNode(event: INodeEvent<NVNode>)
    {
        if (event.add) {
            this.activeNode = event.object;
        }
    }
}