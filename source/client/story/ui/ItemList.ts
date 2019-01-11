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

import System, { IComponentEvent, INodeEvent } from "@ff/graph/System";
import { ComponentType } from "@ff/graph/Component";
import CSelection from "@ff/graph/components/CSelection";

import { customElement, property } from "@ff/ui/CustomElement";
import List from "@ff/ui/List";

import NItemNode from "../../explorer/nodes/NItemNode";

////////////////////////////////////////////////////////////////////////////////

@customElement("sv-item-list")
class ItemList extends List<NItemNode>
{
    @property({ attribute: false })
    system: System = null;

    @property({ attribute: false })
    componentType: ComponentType = null;

    protected selection: CSelection = null;

    protected firstConnected()
    {
        super.firstConnected();

        this.selection = this.system.components.safeGet(CSelection);

        this.classList.add("sv-scrollable");

        if (!this.system) {
            throw new Error("missing system");
        }
    }

    protected connected()
    {
        super.connected();
        this.system.nodes.on<INodeEvent>("node", this.onUpdate, this);
        this.system.components.on<IComponentEvent>("component", this.onUpdate, this);

        this.selection.selectedNodes.on(NItemNode, this.onSelectItemNode, this);
        if (this.componentType) {
            this.selection.selectedComponents.on(this.componentType, this.onSelectComponent, this);
        }
    }

    protected disconnected()
    {
        super.disconnected();
        this.system.nodes.off<INodeEvent>("node", this.onUpdate, this);
        this.system.components.off<IComponentEvent>("component", this.onUpdate, this);

        this.selection.selectedNodes.off(NItemNode, this.onSelectItemNode, this);
        if (this.componentType) {
            this.selection.selectedComponents.off(this.componentType, this.onSelectComponent, this);
        }
    }

    protected render()
    {
        this.data = this.system.nodes.getArray(NItemNode);
        return super.render();
    }

    protected renderItem(node: NItemNode)
    {
        return node.name || node.type;
    }

    protected isItemSelected(node: NItemNode): boolean
    {
        const component = this.componentType ? node.components.get(this.componentType) : null;

        return this.selection.selectedNodes.contains(node) ||
            (component && this.selection.selectedComponents.contains(component));
    }

    protected onSelectItemNode(event: INodeEvent)
    {
        if (event.node instanceof NItemNode) {
            this.setSelected(event.node, event.add);
        }
    }

    protected onSelectComponent(event: IComponentEvent)
    {
        const component = event.component;
        const node = component.node;

        if (node instanceof NItemNode && component.is(this.componentType)) {
            this.setSelected(node, event.add);
        }
    }

    protected onUpdate()
    {
        this.requestUpdate();
    }

    onClickItem(event: MouseEvent, node: NItemNode)
    {
        const component = this.componentType ? node.components.get(this.componentType) : null;

        if (component) {
            this.selection.selectComponent(component, event.ctrlKey);
        }
        else {
            this.selection.selectNode(node, event.ctrlKey);
        }
    }

    protected onClickEmpty(event: MouseEvent)
    {
        if (this.componentType && this.selection.selectedComponents.has(this.componentType)) {
            this.selection.clearSelection();
        }
        else if (this.selection.selectedNodes.has(NItemNode)) {
            this.selection.clearSelection();
        }
    }
}