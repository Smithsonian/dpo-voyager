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

import System from "@ff/graph/System";

import Tree, { customElement, property, PropertyValues, html } from "@ff/ui/Tree";

import CVDocumentProvider, { IActiveDocumentEvent } from "../../components/CVDocumentProvider";
import CVNodeProvider, { IActiveNodeEvent, INodesEvent } from "../../components/CVNodeProvider";
import NVNode from "../../nodes/NVNode";
import NVScene from "../../nodes/NVScene";

////////////////////////////////////////////////////////////////////////////////

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

        this.addEventListener("click", this.onContainerClick.bind(this));

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
        let icons = [];
        if (node.scene) {
            icons.push(html`<ff-icon class="sv-icon-scene" name=${node.scene.icon}></ff-icon>`);
        }
        if (node.model) {
            icons.push(html`<ff-icon class="sv-icon-model" name=${node.model.icon}></ff-icon>`);
        }
        if (node.light) {
            icons.push(html`<ff-icon class="sv-icon-light" name=${node.light.icon}></ff-icon>`);
        }
        if (node.camera) {
            icons.push(html`<ff-icon class="sv-icon-camera" name=${node.camera.icon}></ff-icon>`);
        }
        if (node.meta) {
            icons.push(html`<ff-icon class="sv-icon-meta" name=${node.meta.icon}></ff-icon>`);
        }


        return html`${icons}<div class="ff-text ff-ellipsis">${node.displayName}</div>`;
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

    protected onContainerClick()
    {
        this.nodeProvider.activeNode = null;
    }

    protected onActiveNode(event: IActiveNodeEvent)
    {
        if (event.previous) {
            event.previous.off("change", this.onUpdate, this);
            this.setSelected(event.previous, false);
        }
        if (event.next) {
            this.setSelected(event.next, true);
            event.next.on("change", this.onUpdate, this);
        }
    }
}