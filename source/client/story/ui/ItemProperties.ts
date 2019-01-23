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
import Component, { ComponentType } from "@ff/graph/Component";
import CSelection from "@ff/graph/components/CSelection";

import CustomElement, { property } from "@ff/ui/CustomElement";

import NItem from "../../explorer/nodes/NItem";

////////////////////////////////////////////////////////////////////////////////

export default class ItemProperties<T extends Component> extends CustomElement
{
    @property({ attribute: false })
    system: System = null;

    protected selection: CSelection = null;
    protected componentType: ComponentType<T> = null;
    protected component: T = null;


    constructor(componentType: ComponentType<T>)
    {
        super();
        this.componentType = componentType;
    }

    protected firstConnected()
    {
        this.selection = this.system.components.safeGet(CSelection);
    }

    protected connected()
    {
        this.selection.selectedNodes.on(NItem, this.onSelectItem, this);
        this.selection.selectedComponents.on(this.componentType, this.onSelectComponent, this);

        const node = this.selection.selectedNodes.get(NItem);
        const component = node
            ? node.components.get(this.componentType)
            : this.selection.selectedComponents.get(this.componentType);

        this.setComponent(component);
    }

    protected disconnected()
    {
        this.selection.selectedNodes.off(NItem, this.onSelectItem, this);
        this.selection.selectedComponents.off(this.componentType, this.onSelectComponent, this);
    }

    protected onSelectItem(event: INodeEvent<NItem>)
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