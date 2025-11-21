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

import Node from "@ff/graph/Node";
import Property from "@ff/graph/Property";

import "@ff/scene/ui/PropertyView";

import { customElement, property, html } from "@ff/ui/CustomElement";
import Tree from "@ff/ui/Tree";

import CAmbientLight from "@ff/scene/components/CAmbientLight";
import CDirectionalLight from "@ff/scene/components/CDirectionalLight";
import CHemisphereLight from "@ff/scene/components/CHemisphereLight";
import CSpotLight from "@ff/scene/components/CSpotLight";
import CTransform from "@ff/scene/components/CTransform";
import { Property as SceneUIProperty } from "@ff/scene/ui/PropertyField";
import CVEnvironmentLight from "client/components/lights/CVEnvironmentLight";
import { lightTypes } from "../../applications/coreTypes";
import CVSettingsTask from "../../components/CVSettingsTask";
import { TaskView } from "../../components/CVTask";
import { CLight, ELightType } from "../../components/lights/CVLight";
import NVNode from "../../nodes/NVNode";
import NodeTree from "./NodeTree";

////////////////////////////////////////////////////////////////////////////////

@customElement("sv-settings-task-view")
export default class SettingsTaskView extends TaskView<CVSettingsTask>
{
    protected onLightTypeChange(e: Event) {
        const select = e.target as HTMLSelectElement;
        const newType = parseInt(select.value) as ELightType;
        const oldNode: NVNode = this.activeNode as NVNode;
        if (!oldNode || !oldNode.light) return;

        const oldType: string = ELightType[(oldNode.light.constructor as any).type];
        if (newType === (ELightType as any)[oldType]) return;

        const parent: NVNode = (oldNode.transform.parent as any)?.node as NVNode;
        const newNode: NVNode = NodeTree.createLightNode(parent, newType, oldNode.name);

        copyLightProperties(oldNode, newNode);

        // Reconstruct original order of light nodes
        const transforms: CTransform[] = parent.transform.children.slice();
        const reordered: CTransform[] = transforms.map(t => t === oldNode.transform ? newNode.transform : t);
        transforms.forEach(t => { parent.transform.removeChild(t); });        
        reordered.forEach(t => { parent.transform.addChild(t); });

        oldNode.dispose();
        this.nodeProvider.activeNode = newNode;
        this.requestUpdate();
    }

    protected render()
    {
        if(!this.activeDocument) {
            return;
        }
        const languageManager = this.activeDocument.setup.language;
        const node = this.activeNode;
        if (!node) {
            return html`<div class="sv-placeholder">${languageManager.getUILocalizedString("Please select a node to display its properties.")}</div>`;
        }

        let currentType: ELightType = null;
        if (node.light) {
            const lt = lightTypes.find(lt => lt.typeName === node.light.typeName);
            if (lt) {
                currentType = ELightType[lt.type];
            }
        }

        return html`<div class="ff-flex-item-stretch ff-scroll-y ff-flex-column">
            ${(node.light && !(node.light instanceof CVEnvironmentLight)) ? html`<div class="ff-group" style="padding:4px 8px;">
                <div class="ff-flex-row" style="align-items:center; gap:6px;">
                    <label class="ff-label">${languageManager.getUILocalizedString("Type")}</label>
                    <select class="ff-input" .value=${currentType ?? 0} @change=${(e: Event) => this.onLightTypeChange(e)}>
                        ${Object.keys(ELightType).filter(key => typeof (ELightType as any)[key] === "number").map(key => html`<option value=${(ELightType as any)[key]}>${key}</option>`)}
                    </select>
                </div>
            </div>` : null}
            <sv-settings-tree class="ff-flex-item-stretch" .node=${node}></sv-settings-tree>
        </div>`;
    }

    protected onActiveNode(previous: NVNode, next: NVNode)
    {
        this.requestUpdate();
    }
}

////////////////////////////////////////////////////////////////////////////////

interface ITreeNode
{
    id: string;
    children: ITreeNode[];
    text: string;
    classes: string;
    property?: Property;
}

@customElement("sv-settings-tree")
export class SettingsTree extends Tree<ITreeNode>
{
    @property({ attribute: false })
    node: NVNode = null;

    protected firstConnected()
    {
        super.firstConnected();
        this.classList.add("ff-property-tree", "sv-settings-tree");
    }

    protected getClasses(treeNode: ITreeNode)
    {
        return treeNode.classes;
    }

    protected update(changedProperties: Map<PropertyKey, unknown>)
    {
        if (changedProperties.has("node")) {
            this.root = this.createNodeTreeNode(this.node);
        }

        super.update(changedProperties);
    }

    protected renderNodeHeader(node: ITreeNode)
    {
        if (!node.property) {
            return html`<div class="ff-text ff-label ff-ellipsis">${node.text}</div>`;
        }

        return html`<sv-property-view .property=${node.property}></sv-property-view>`;

    }

    protected createNodeTreeNode(node: Node): ITreeNode
    {
        const components = node.components.getArray().filter(component => component["settingProperties"] && !component.tags.has("no_settings"));

        return {
            id: node.id,
            text: node.displayName,
            classes: "ff-node",
            children: components.map(component => ({
                id: component.id,
                text: component.displayName,
                classes: "ff-component",
                property: null,
                children: this.createPropertyNodes(component["settingProperties"]),
            })),
        };
    }

    protected createPropertyNodes(properties: Property[]): ITreeNode[]
    {
        const root: Partial<ITreeNode> = {
            children: []
        };

        properties.forEach(property => {
            const fragments = property.path.split(".");
            let node = root;

            const count = fragments.length;
            const last = count - 1;

            for (let i = 0; i < count; ++i) {
                const fragment = fragments[i];
                let child = node.children.find(node => node.text === fragment);

                if (!child) {
                    const id = i === last ? property.key : fragment;

                    child = {
                        id,
                        text: fragment,
                        classes: "",
                        children: [],
                        property: i === last ? property : null
                    };
                    node.children.push(child);
                }
                node = child;
            }
        });

        return root.children;
    }
}

function copyLightProperties(sourceNode: NVNode, targetNode: NVNode) {
    // TODO: memorize properties that are not in the target light for reference when reverting a light type change

    const sourceLight: CLight = sourceNode.light;
    const targetLight: CLight = targetNode.light;

    (sourceLight as any).settingProperties
        .forEach((sourceProp: SceneUIProperty) => {
            targetLight.ins.properties
                .find(targetProp => targetProp.key === sourceProp.key)
                ?.setValue(sourceProp.value);
        });

    // Convert intensity to/from legacy light types
    // Source: https://sbcode.net/threejs/lights/
    const legacyLightTypes = [CAmbientLight, CDirectionalLight, CHemisphereLight, CSpotLight];

    const sourceLightIsLegacy: boolean = legacyLightTypes.some(lt => sourceLight instanceof lt);
    const targetLightIsLegacy: boolean = legacyLightTypes.some(lt => targetLight instanceof lt);
    if (sourceLightIsLegacy && !targetLightIsLegacy) {
        targetLight.ins.setValues({ "intensity": sourceLight.ins.intensity.value / Math.PI });
    } else if (targetLightIsLegacy && !sourceLightIsLegacy) {
        targetLight.ins.setValues({ "intensity": sourceLight.ins.intensity.value * Math.PI });
    }

    (sourceLight.transform as any).settingProperties
        .forEach((sourceProp: SceneUIProperty) => {
            targetNode.transform.ins.properties
                .find(targetProp => targetProp.key === sourceProp.key)
                ?.setValue(sourceProp.value);
        });
}
