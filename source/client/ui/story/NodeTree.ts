/**
 * 3D Foundation Project
 * Copyright 2025 Smithsonian Institution
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

import { lightTypes } from "../../applications/coreTypes";
import CVDocumentProvider, { IActiveDocumentEvent } from "../../components/CVDocumentProvider";
import CVLanguageManager from "../../components/CVLanguageManager";
import CVNodeProvider, { IActiveNodeEvent, INodesEvent } from "../../components/CVNodeProvider";
import { ELightType, ICVLight } from "../../components/lights/CVLight";
import NVNode from "../../nodes/NVNode";
import NVScene from "../../nodes/NVScene";
import ConfirmDeleteLightMenu from "./ConfirmDeleteLightMenu";
import CreateLightMenu from "./CreateLightMenu";

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

        var addButton = null;
        var deleteButton = null;
        if (node.name === "Lights") {
            addButton = html`<ff-button icon="create" title="Create Light" class="sv-add-light-btn" @click=${(e: MouseEvent) => this.onClickAddLight(e, node)}></ff-button>`;
        } else if (node.light) {
            deleteButton = html`<ff-button icon="trash" title="Delete Light" class="sv-delete-light-btn" @click=${(e: MouseEvent) => this.onClickDeleteLight(e, node)}></ff-button>`;
        }
        
        return html`${icons}<div class="ff-text ff-ellipsis sv-node-label" style="flex:1 1 auto;">${node.displayName}</div>${addButton}${deleteButton}`;
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

    protected onClickAddLight(event: MouseEvent, parentNode: NVNode)
    {
        event.stopPropagation();

        const mainView = document.getElementsByTagName('voyager-story')[0] as HTMLElement;
        const language: CVLanguageManager = this.documentProvider.activeComponent.setup.language;

        CreateLightMenu
            .show(mainView, language)
            .then(([selectedType, name]) => {
                const lightNode = NodeTree.createLightNode(parentNode, selectedType, name);
                parentNode.transform.addChild(lightNode.transform);
                this.nodeProvider.activeNode = lightNode;

                this.setExpanded(parentNode, true);
                this.requestUpdate();
            })
            .catch(e => console.error("Error creating light:", e));
    }

    static createLightNode(parentNode: NVNode, newType: ELightType, name: string): NVNode {
        const lightType = lightTypes.find(lt => lt.type === ELightType[newType].toString());
        if (!lightType) throw new Error(`Unsupported light type: '${newType}'`);

        const lightNode: NVNode = parentNode.graph.createCustomNode(parentNode);
        lightNode.transform.createComponent<ICVLight>(lightType);
        lightNode.name = name;

        return lightNode;
    }

    protected onClickDeleteLight(event: MouseEvent, node: NVNode) {
        event.stopPropagation();
        if (!node.light) return;
        const mainView = document.getElementsByTagName('voyager-story')[0] as HTMLElement;
        const language: CVLanguageManager = this.documentProvider.activeComponent.setup.language;

        ConfirmDeleteLightMenu.show(mainView, language, node.name)
            .then(confirmed => {
                if (confirmed) {
                    if (this.nodeProvider.activeNode === node) {
                        this.nodeProvider.activeNode = node.transform.parent?.node as NVNode;
                    }
                    node.dispose();
                    this.requestUpdate();
                }
            });
    }
}

export default NodeTree;