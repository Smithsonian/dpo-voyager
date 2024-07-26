/**
 * 3D Foundation Project
 * Copyright 2024 Smithsonian Institution
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

import Color from "@ff/core/Color";
import Property from "@ff/graph/Property";

import CustomElement, { customElement, property, PropertyValues, html } from "@ff/ui/CustomElement";

import "@ff/ui/Button";
import { IButtonClickEvent } from "@ff/ui/Button";

import "@ff/ui/ColorEdit";
import { IColorEditChangeEvent } from "@ff/ui/ColorEdit";

import {getFocusableElements, focusTrap} from "../utils/focusHelpers";

////////////////////////////////////////////////////////////////////////////////

@customElement("sv-property-color")
export default class PropertyColor extends CustomElement
{
    @property({ attribute: false })
    property: Property = null;

    @property({ type: String })
    name = "";

    protected color: Color = new Color();

    constructor()
    {
        super();
    }

    protected firstConnected()
    {
        super.firstConnected();
        this.classList.add("sv-property", "sv-property-color");
    }

    protected update(changedProperties: PropertyValues): void
    {
        if (!this.property) {
            throw new Error("missing property attribute");
        }

        if (this.property.type !== "number" || this.property.elementCount !== 3) {
            throw new Error(`not an color property: '${this.property.path}'`);
        }

        if (changedProperties.has("property")) {
            const property = changedProperties.get("property") as Property;
            if (property) {
                property.off("value", this.onPropertyChange, this);
            }
            if (this.property) {
                this.property.on("value", this.onPropertyChange, this);
                this.color.fromArray(this.property.value);
            }
        }

        super.update(changedProperties);
    }

    protected render()
    {
        const property = this.property;
        const name = this.name || property.name;
        const color = this.color.toString();

        return html`<label class="ff-label ff-off">${name}</label>
            <input type="color" tabindex="0" .value="${color}" @change=${this.onColorChange}>
        `;
    }

    protected onColorChange(event: Event)
    {
        this.color = new Color((event.target as HTMLInputElement).value);
        this.property.setValue(this.color.toRGBArray());
    }

    protected onPropertyChange(value: number[])
    {
        this.color.fromArray(value);
        this.requestUpdate();
    }
}