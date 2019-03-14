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

import Component, { types } from "@ff/graph/Component";

import CVDocumentManager from "../../explorer/components/CVDocumentManager";
import CVDocument from "../../explorer/components/CVDocument";

import NVItem from "../nodes/NVItem";

////////////////////////////////////////////////////////////////////////////////

/**
 * System component keeping track of all items in the currently active document.
 * One item at a time can be the active item.
 */
export default class CVItemManager extends Component
{
    static readonly typeName: string = "CVItemManager";
    static readonly isSystemSingleton = true;

    protected static readonly ins = {
        activeItem: types.Option("Items.ActiveItem", []),
        activeDocument: types.Object("Items.ActiveDocument", CVDocument),
    };

    protected static readonly outs = {
        activeItem: types.Object("Items.ActiveItem", NVItem),
        changedItems: types.Event("Items.Changed"),
    };

    ins = this.addInputs(CVItemManager.ins);
    outs = this.addOutputs(CVItemManager.outs);

    protected activeDocument: CVDocument = null;

    get items(): NVItem[] {
        const document = this.ins.activeDocument.value;
        return document ? document.getInnerNodes(NVItem) : [];
    }
    get activeItem(): NVItem {
        return this.outs.activeItem.value;
    }
    set activeItem(item: NVItem) {
        if (item !== this.activeItem) {
            const index = this.items.indexOf(item);
            this.ins.activeItem.setValue(index + 1);
        }
    }

    create()
    {
        const documentManager = this.getMainComponent(CVDocumentManager);
        documentManager.outs.activeDocument.linkTo(this.ins.activeDocument);

        this.updateItems();
    }

    update()
    {
        const ins = this.ins;

        if (ins.activeDocument.changed) {

            if (this.activeDocument) {
                this.activeDocument.innerNodes.off(NVItem, this.updateItems, this);
            }

            this.activeDocument = ins.activeDocument.value;

            if (this.activeDocument) {
                this.activeDocument.innerNodes.on(NVItem, this.updateItems, this);
            }

            this.updateItems();
        }

        if (ins.activeItem.changed) {
            const index = ins.activeItem.getValidatedValue() - 1;
            const nextItem = index >= 0 ? this.items[index] : null;
            const activeItem = this.outs.activeItem.value;

            if (nextItem !== activeItem) {
                this.outs.activeItem.setValue(nextItem);
            }
        }

        return true;
    }

    dispose()
    {
        if (this.activeDocument) {
            this.activeDocument.innerNodes.off(NVItem, this.updateItems, this);
        }
    }

    protected updateItems()
    {
        // update the list of items from the current active document
        const items = this.items;
        const names = items.map(item => item.displayName);
        names.unshift("(none)");
        this.ins.activeItem.setOptions(names);

        let activeItem = this.outs.activeItem.value;

        const index = activeItem ?
            items.indexOf(activeItem) :
            Math.min(1, items.length);

        if (index !== this.ins.activeItem.getValidatedValue()) {
            this.ins.activeItem.setValue(index);
        }

        this.outs.changedItems.set();
    }
}