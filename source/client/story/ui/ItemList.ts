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

import CVItemManager from "../../explorer/components/CVItemManager";

import NVItem from "../../explorer/nodes/NVItem";


////////////////////////////////////////////////////////////////////////////////

@customElement("sv-item-list")
class ItemList extends List<NVItem>
{
    @property({ attribute: false })
    system: System = null;

    protected itemManager: CVItemManager = null;
    protected selection: CSelection = null;

    protected firstConnected()
    {
        super.firstConnected();
        this.classList.add("sv-scrollable", "sv-item-list");

        this.itemManager = this.system.getMainComponent(CVItemManager);
        this.selection = this.system.getMainComponent(CSelection);
    }

    protected connected()
    {
        super.connected();

        this.selection.selectedComponents.on(CComponent, this.onSelectComponent, this);
        this.selection.selectedNodes.on(NVItem, this.onRequestUpdate, this);
        this.itemManager.on("update", this.onRequestUpdate, this);
    }

    protected disconnected()
    {
        this.selection.selectedComponents.off(CComponent, this.onSelectComponent, this);
        this.selection.selectedNodes.off(NVItem, this.onRequestUpdate, this);
        this.itemManager.off("update", this.onRequestUpdate, this);

        super.disconnected();
    }

    protected update(props: PropertyValues)
    {
        this.data = this.itemManager.items;
        return super.update(props);
    }

    protected renderItem(item: NVItem)
    {
        const isActive = item === this.itemManager.activeItem;
        return html`<div class="ff-flex-row"><ff-icon name=${isActive ? "check" : "empty"}></ff-icon>
            <ff-text class="ff-ellipsis">${item.displayName}</ff-text></div>`;
    }

    protected isItemSelected(item: NVItem): boolean
    {
        return this.selection.selectedNodes.contains(item)
            || this.selection.nodeContainsSelectedComponent(item);
    }

    protected onSelectComponent(event: IComponentEvent)
    {
        if (event.object.node.is(NVItem)) {
            this.requestUpdate();
        }
    }

    protected onClickItem(event: MouseEvent, item: NVItem)
    {
        this.itemManager.activeItem = item;
    }

    protected onRequestUpdate()
    {
        this.requestUpdate();
    }
}