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

import Component, { types, ITypedEvent } from "@ff/graph/Component";
import CDocumentManager, { IActiveDocumentEvent } from "@ff/graph/components/CDocumentManager";

import NVItem from "../nodes/NVItem";

////////////////////////////////////////////////////////////////////////////////

export interface IItemManagerChangeEvent extends ITypedEvent<"change">
{
}

export interface IActiveItemEvent extends ITypedEvent<"active-item">
{
    previous: NVItem;
    next: NVItem;
}

const _inputs = {
    activeItem: types.Option("Items.Active", []),
};

/**
 * System component keeping track of all items in the currently active document.
 * One item at a time can be the active item.
 */
export default class CVItemManager extends Component
{
    static readonly typeName: string = "CVItemManager";
    static readonly isSystemSingleton = true;

    ins = this.addInputs(_inputs);

    private _activeItem: NVItem = null;

    get items(): NVItem[] {
        const document = this.documentManger.activeDocument;
        return document ? document.getInnerNodes(NVItem) : [];
    }

    get activeItem(): NVItem {
        return this._activeItem;
    }
    set activeItem(item: NVItem) {
        if (item !== this._activeItem) {
            const previous = this._activeItem;
            this._activeItem = item;

            const index = this.items.indexOf(item);
            this.ins.activeItem.setValue(index + 1, true);

            this.emit<IActiveItemEvent>({
                type: "active-item",
                previous,
                next: item
            });
        }
    }

    protected get documentManger() {
        return this.getMainComponent(CDocumentManager);
    }

    create()
    {
        this.system.nodes.on(NVItem, this.updateItems, this);
        this.documentManger.on<IActiveDocumentEvent>("active-document", this.updateItems, this);

        this.updateItems();
    }

    update()
    {
        const ins = this.ins;

        if (ins.activeItem.changed) {
            const index = ins.activeItem.getValidatedValue() - 1;
            this.activeItem = index >= 0 ? this.items[index] : null;
        }

        return true;
    }

    dispose()
    {
        this.system.nodes.off(NVItem, this.updateItems, this);
        this.documentManger.off<IActiveDocumentEvent>("active-document", this.updateItems, this);
    }

    protected updateItems()
    {
        // update the list of items from the current active document
        const items = this.items;
        const names = items.map(item => item.displayName);
        names.unshift("(none)");
        this.ins.activeItem.setOptions(names);

        // if the current active item is invalid, set the first item in the list active
        const activeItem = this._activeItem;
        let index = activeItem ? items.indexOf(activeItem) : -1;
        if (index < 0) {
            console.log(items);
            this.activeItem = items[0];
            index = 0;
        }

        this.ins.activeItem.setValue(index);
        this.emit<IItemManagerChangeEvent>({ type: "change" });
    }
}