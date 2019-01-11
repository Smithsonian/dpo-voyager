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

import { ComponentType } from "@ff/graph/Component";
import { customElement, property } from "@ff/ui/CustomElement";
import List from "@ff/ui/List";

import ItemNode from "../../explorer/nodes/ItemNode";
import ExplorerSystem, { IComponentEvent, INodeEvent } from "../../explorer/ExplorerSystem";

////////////////////////////////////////////////////////////////////////////////

@customElement("sv-item-list")
class ItemList extends List<ItemNode>
{
    @property({ attribute: false })
    system: ExplorerSystem = null;

    @property({ attribute: false })
    componentType: ComponentType = null;


    protected firstConnected()
    {
        super.firstConnected();
        this.classList.add("sv-scrollable");

        if (!this.system) {
            throw new Error("missing system");
        }
    }

    protected connected()
    {
        super.connected();
        this.system.components.on<INodeEvent>("component", this.onUpdate, this);
        this.system.components.on<IComponentEvent>("component", this.onUpdate, this);

        const selectionController = this.system.selectionController;
        selectionController.nodes.on(ItemNode, this.onSelectItemNode, this);
        if (this.componentType) {
            selectionController.components.on(this.componentType, this.onSelectComponent, this);
        }
    }

    protected disconnected()
    {
        super.disconnected();
        this.system.components.off<INodeEvent>("component", this.onUpdate, this);
        this.system.components.off<IComponentEvent>("component", this.onUpdate, this);

        const selectionController = this.system.selectionController;
        selectionController.nodes.off(ItemNode, this.onSelectItemNode, this);
        if (this.componentType) {
            selectionController.components.off(this.componentType, this.onSelectComponent, this);
        }
    }

    protected render()
    {
        this.data = this.system.nodes.getArray(ItemNode);
        return super.render();
    }

    protected renderItem(node: ItemNode)
    {
        return node.name || node.type;
    }

    protected isItemSelected(node: ItemNode): boolean
    {
        const selectionController = this.system.selectionController;
        const component = this.componentType ? node.components.get(this.componentType) : null;

        return selectionController.nodes.contains(node) ||
            (component && selectionController.components.contains(component));
    }

    protected onSelectItemNode(event: INodeEvent)
    {
        if (event.node instanceof ItemNode) {
            this.setSelected(event.node, event.add);
        }
    }

    protected onSelectComponent(event: IComponentEvent)
    {
        const component = event.component;
        const node = component.node;

        if (node instanceof ItemNode && component.is(this.componentType)) {
            this.setSelected(node, event.add);
        }
    }

    protected onUpdate()
    {
        this.requestUpdate();
    }

    onClickItem(event: MouseEvent, node: ItemNode)
    {
        const selectionController = this.system.selectionController;
        const component = this.componentType ? node.components.get(this.componentType) : null;

        if (component) {
            selectionController.selectComponent(component, event.ctrlKey);
        }
        else {
            selectionController.selectNode(node, event.ctrlKey);
        }
    }

    protected onClickEmpty(event: MouseEvent)
    {
        const selectionController = this.system.selectionController;

        if (this.componentType && selectionController.components.has(this.componentType)) {
            selectionController.clearSelection();
        }
        else if (selectionController.nodes.has(ItemNode)) {
            selectionController.clearSelection();
        }
    }
}