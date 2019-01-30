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
import CComponent from "@ff/graph/Component";
import CSelection, { IComponentEvent } from "@ff/graph/components/CSelection";

import { customElement, html, property, PropertyValues } from "@ff/ui/CustomElement";
import List from "@ff/ui/List";
import "@ff/ui/Icon";

import NVItem from "../../explorer/nodes/NVItem";

import CVPresentationController, {
    IActiveItemEvent,
    IActivePresentationEvent
} from "../../explorer/components/CVPresentationController";

////////////////////////////////////////////////////////////////////////////////

@customElement("sv-item-list")
class ItemList extends List<NVItem>
{
    @property({ attribute: false })
    system: System = null;

    protected presentations: CVPresentationController = null;
    protected selection: CSelection = null;

    protected firstConnected()
    {
        super.firstConnected();
        this.classList.add("sv-scrollable", "sv-item-list");

        this.presentations = this.system.components.safeGet(CVPresentationController);
        this.selection = this.system.components.safeGet(CSelection);
    }

    protected connected()
    {
        super.connected();

        this.selection.selectedComponents.on(CComponent, this.onSelectComponent, this);
        this.selection.selectedNodes.on(NVItem, this.performUpdate, this);
        this.presentations.on<IActivePresentationEvent>("active-presentation", this.performUpdate, this);
        this.presentations.on<IActiveItemEvent>("active-item", this.performUpdate, this);
    }

    protected disconnected()
    {
        this.selection.selectedComponents.off(CComponent, this.onSelectComponent, this);
        this.selection.selectedNodes.off(NVItem, this.performUpdate, this);
        this.presentations.off<IActivePresentationEvent>("active-presentation", this.performUpdate, this);
        this.presentations.off<IActiveItemEvent>("active-item", this.performUpdate, this);

        super.disconnected();
    }

    protected update(props: PropertyValues)
    {
        this.data = this.presentations.items;
        return super.update(props);
    }

    protected renderItem(node: NVItem)
    {
        const isActive = node === this.presentations.activeItem;
        return html`<div class="ff-flex-row"><ff-icon name=${isActive ? "check" : "empty"}></ff-icon>
            <ff-text class="ff-ellipsis">${node.displayName}</ff-text></div>`;
    }

    protected isItemSelected(node: NVItem): boolean
    {
        return this.selection.selectedNodes.contains(node)
            || this.selection.nodeContainsSelectedComponent(node);
    }

    protected onClickItem(event: MouseEvent, node: NVItem)
    {
        this.presentations.activeItem = node;
    }

    protected onSelectComponent(event: IComponentEvent)
    {
        if (event.component.node.type === NVItem.type) {
            this.requestUpdate();
        }
    }
}