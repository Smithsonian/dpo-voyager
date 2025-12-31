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
import CLight from "@ff/scene/components/CLight";
import ConfirmDeleteLightMenu from "./ConfirmDeleteLightMenu";
import CreateLightMenu from "./CreateLightMenu";
import CVScene from "client/components/CVScene";
import unitScaleFactor from "client/utils/unitScaleFactor";
import { EUnitType } from "client/schema/common";

////////////////////////////////////////////////////////////////////////////////

@customElement("sv-node-tree")
class NodeTree extends Tree<NVNode>
{
    @property({ attribute: false })
    system: System;

    protected documentProvider: CVDocumentProvider = null;
    protected nodeProvider: CVNodeProvider = null;
    protected selectedLightNodes: Set<NVNode> = new Set();

    protected firstConnected()
    {
        super.firstConnected();
        this.classList.add("sv-node-tree");
        this.selectedLightNodes = new Set();

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
        let buttons = [];

        if (node.scene) {
            icons.push(html`<ff-icon class="sv-icon-scene" name=${node.scene.icon}></ff-icon>`);
        }
        if (node.model) {
            icons.push(html`<ff-icon class="sv-icon-model" name=${node.model.icon}></ff-icon>`);
        }
        if (node.name === "Lights") {
            buttons.push(html`<ff-button icon="create" title="Create Light" class="sv-add-light-btn" @click=${(e: MouseEvent) => this.onClickAddLight(e, node)}></ff-button>`);
        }
        if (node.light) {
            const isSelected = this.selectedLightNodes.has(node);
            icons.push(html`<input type="checkbox" 
                class="sv-light-checkbox" 
                .checked=${isSelected}
                @click=${(e: MouseEvent) => this.onLightCheckboxClick(e, node)}
                @change=${(e: Event) => e.stopPropagation()}>`);
            icons.push(html`<ff-icon class="${node.light.ins.enabled.value ? "sv-icon-light ff-icon": "sv-icon-disabled ff-icon"}" name=${node.light.icon}></ff-icon>`);
            if(node.light.canDelete) {
                buttons.push(html`<ff-button icon="trash" title="Delete Light" class="sv-delete-light-btn" @click=${(e: MouseEvent) => this.onClickDeleteLight(e, node)}></ff-button>`);
            }
        }
        if (node.camera) {
            icons.push(html`<ff-icon class="sv-icon-camera" name=${node.camera.icon}></ff-icon>`);
        }
        if (node.meta) {
            icons.push(html`<ff-icon class="sv-icon-meta" name=${node.meta.icon}></ff-icon>`);
        }

        return html`${icons}<div class="ff-text ff-ellipsis">${node.displayName}</div>${buttons}`;
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
            const light = treeNode.transform.getComponent(CLight);
            return light.ins.enabled.value ? "sv-node-light" : "sv-node-light disabled";
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
        const newLight: ICVLight = lightNode.transform.createComponent<ICVLight>(lightType);

        // Set reasonable initial size
        const scene: CVScene = newLight.getGraphComponent(CVScene);
        let scale = unitScaleFactor(EUnitType.m, scene.ins.units.value)*0.5;
        scale *= newType === ELightType.rect ? 0.05 : 0.5;
        newLight.transform.ins.scale.setValue([scale,scale,scale]);

        newLight.ins.name.setValue(name);
        newLight.update(this);  // trigger light update before helper creation to ensure proper init

        newLight.getGraphComponent(CVScene).ins.lightUpdated.set();

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

    protected onLightCheckboxClick(event: MouseEvent, node: NVNode) {
        event.stopPropagation();
        
        if (this.selectedLightNodes.has(node)) {
            this.selectedLightNodes.delete(node);
        } else {
            this.selectedLightNodes.add(node);
        }
        
        this.requestUpdate();
        this.dispatchEvent(new CustomEvent('light-selection-changed', {
            detail: { selectedCount: this.selectedLightNodes.size },
            bubbles: true
        }));
    }

    public getSelectedLightNodes(): NVNode[] {
        return Array.from(this.selectedLightNodes);
    }

    public clearSelectedLights() {
        this.selectedLightNodes.clear();
        this.requestUpdate();
    }

    public enableSelectedLights(enabled: boolean) {
        this.selectedLightNodes.forEach(node => {
            if (node.light) {
                node.light.ins.enabled.setValue(enabled);
            }
        });
        this.requestUpdate();
    }
}

export default NodeTree;