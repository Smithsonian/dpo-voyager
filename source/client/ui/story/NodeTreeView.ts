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

import System from "@ff/graph/System";

import CustomElement, { customElement, property, PropertyValues, html } from "@ff/ui/CustomElement";
import Tree from "@ff/ui/Tree";

import SystemView from "@ff/scene/ui/SystemView";

import CVDocumentProvider, { IActiveDocumentEvent } from "../../components/CVDocumentProvider";
import CVNodeProvider, { IActiveNodeEvent, INodesEvent } from "../../components/CVNodeProvider";
import NVNode from "../../nodes/NVNode";
import NVScene from "../../nodes/NVScene";

////////////////////////////////////////////////////////////////////////////////

@customElement("sv-node-tree-view")
class NodeTreeView extends SystemView
{
    constructor(system?: System)
    {
        super(system);
        this.addEventListener("click", this.onClick.bind(this));
    }

    protected firstConnected()
    {
        super.firstConnected();
        this.classList.add("ff-scroll-y", "sv-node-tree-view");
    }

    protected render()
    {
        return html`<sv-node-tree .system=${this.system}></sv-node-tree>`;
    }

    protected onClick()
    {
        this.system.getMainComponent(CVNodeProvider).activeNode = null;
    }
}

@customElement("sv-node-tree")
class NodeTree extends Tree<NVNode>
{
    @property({ attribute: false })
    system: System;

    protected documentProvider: CVDocumentProvider = null;
    protected nodeProvider: CVNodeProvider = null;

    protected firstConnected()
    {
        super.firstConnected();
        this.classList.add("sv-node-tree");

        this.documentProvider = this.system.getMainComponent(CVDocumentProvider);
        this.nodeProvider = this.system.getMainComponent(CVNodeProvider);
    }

    protected connected()
    {
        super.connected();
        this.documentProvider.on<IActiveDocumentEvent>("active-component", this.onUpdate, this);
        this.nodeProvider.on<IActiveNodeEvent>("active-node", this.onActiveNode, this);
        this.nodeProvider.on<INodesEvent>("scoped-nodes", this.onUpdate, this);
    }

    protected disconnected()
    {
        this.nodeProvider.off<INodesEvent>("scoped-nodes", this.onUpdate, this);
        this.nodeProvider.off<IActiveNodeEvent>("active-node", this.onActiveNode, this);
        this.documentProvider.off<IActiveDocumentEvent>("active-component", this.onUpdate, this);
        super.disconnected();
    }

    protected update(changedProperties: PropertyValues): void
    {
        const document = this.documentProvider.activeComponent;

        if (document) {
            this.root = {
                id: "scene",
                children: [ document.root ]
            } as any;
        }
        else {
            this.root = null;
        }

        super.update(changedProperties);
    }

    protected renderNodeHeader(node: NVNode)
    {
        return html`<div class="ff-text ff-ellipsis">${node.displayName}</div>`;
    }

    protected isNodeSelected(node: NVNode): boolean
    {
        return node === this.nodeProvider.activeNode;
    }

    protected getClasses(treeNode: NVNode): string
    {
        if (treeNode.scene) {
            return "sv-node-scene"
        }
        if (treeNode.model) {
            return "sv-node-model";
        }
        if (treeNode.light) {
            return "sv-node-light";
        }
        if (treeNode.camera) {
            return "sv-node-camera";
        }
    }

    protected getChildren(node: NVNode)
    {
        if (node === this.root) {
            return super.getChildren(node);
        }
        else {
            return node.transform.children
            .map(child => child.node)
            .filter(child => child.is(NVNode) || child.is(NVScene));
        }

    }

    protected onNodeClick(event: MouseEvent, node: NVNode)
    {
        const rect = (event.currentTarget as HTMLElement).getBoundingClientRect();

        if (event.clientX - rect.left < 30) {
            this.toggleExpanded(node);
        }
        else {
            this.nodeProvider.activeNode = node;
        }
    }

    protected onActiveNode(event: IActiveNodeEvent)
    {
        if (event.previous) {
            this.setSelected(event.previous, false);
        }
        if (event.next) {
            this.setSelected(event.next, true);
        }
    }
}