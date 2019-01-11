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

import Component, { ComponentType } from "@ff/graph/Component";
import CustomElement, { property } from "@ff/ui/CustomElement";

import ItemNode from "../../explorer/nodes/ItemNode";
import ExplorerSystem, { IComponentEvent, INodeEvent } from "../../explorer/ExplorerSystem";

////////////////////////////////////////////////////////////////////////////////

export default class ItemProperties<T extends Component> extends CustomElement
{
    @property({ attribute: false })
    system: ExplorerSystem = null;

    protected componentType: ComponentType<T>;
    protected component: T = null;


    constructor(componentType: ComponentType<T>)
    {
        super();
        this.componentType = componentType;
    }

    protected connected()
    {
        const selectionController = this.system.selectionController;
        selectionController.nodes.on(ItemNode, this.onSelectItem, this);
        selectionController.components.on(this.componentType, this.onSelectComponent, this);

        const node = selectionController.nodes.get(ItemNode);
        const component = node
            ? node.components.get(this.componentType)
            : selectionController.components.get(this.componentType);

        this.setComponent(component);
    }

    protected disconnected()
    {
        const selectionController = this.system.selectionController;
        selectionController.nodes.off(ItemNode, this.onSelectItem, this);
        selectionController.components.off(this.componentType, this.onSelectComponent, this);
    }

    protected onSelectItem(event: INodeEvent<ItemNode>)
    {
        const component = event.node.components.get<T>(this.componentType);
        if (!component) {
            return;
        }

        if (event.add && !this.component) {
            this.setComponent(component);
        }
        else if (event.remove && this.component === component) {
            this.setComponent(null);
        }
    }

    protected onSelectComponent(event: IComponentEvent<T>)
    {
        if (event.add && !this.component) {
            this.setComponent(event.component);
        }
        else if (event.remove && this.component === event.component) {
            this.setComponent(null);
        }
    }

    protected setComponent(component: T)
    {
        this.component = component;
        this.requestUpdate();
    }
}