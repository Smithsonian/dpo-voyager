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

import DocumentView, {
    customElement,
    property,
    html,
    PropertyValues,
    TemplateResult
} from "./DocumentView";

import CVItemManager from "../components/CVItemManager";
import NVItem_old from "../nodes/NVItem_old";

////////////////////////////////////////////////////////////////////////////////

export { customElement, property, html, PropertyValues, TemplateResult };

export default class ItemView extends DocumentView
{
    private _activeItem: NVItem_old = null;

    protected get itemManager() {
        return this.system.getMainComponent(CVItemManager);
    }
    protected get activeItem() {
        return this._activeItem;
    }

    protected connected()
    {
        super.connected();

        const activeItemProp = this.itemManager.outs.activeItem;
        activeItemProp.on("value", this._onActiveItem, this);
        this._onActiveItem(activeItemProp.value);
    }

    protected disconnected()
    {
        this._onActiveItem(null);
        this.itemManager.outs.activeItem.off("value", this._onActiveItem, this);

        super.disconnected();
    }

    protected onActiveItem(previous: NVItem_old, next: NVItem_old)
    {
    }

    private _onActiveItem(item: NVItem_old)
    {
        if (item !== this._activeItem) {
            this.onActiveItem(this._activeItem, item);
            this._activeItem = item;
        }
    }
}