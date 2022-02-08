/**
 * 3D Foundation Project
 * Copyright 2019 Smithsonian Institution
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
    protected pickerActive = false;

    constructor()
    {
        super();
        this.onPointerDown = this.onPointerDown.bind(this);
    }

    protected firstConnected()
    {
        super.firstConnected();
        this.classList.add("sv-property-view", "sv-property-color");
    }

    protected connected()
    {
        document.addEventListener("pointerdown", this.onPointerDown, { capture: true, passive: true });
    }

    protected disconnected()
    {
        document.removeEventListener("pointerdown", this.onPointerDown);
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
            <ff-button style="background-color: ${color}" title="${name} Color Picker" @click=${this.onButtonClick}></ff-button>
            ${this.pickerActive ? html`<ff-color-edit .color=${this.color} @keydown=${e =>this.onKeyDown(e)} @change=${this.onColorEditChange}></ff-color-edit>` : null}`;
    }

    protected async setPickerFocus()
    {
        await this.updateComplete;
        const container = this.getElementsByTagName("ff-color-edit").item(0) as HTMLElement;
        (getFocusableElements(container)[0] as HTMLElement).focus();
    }

    protected onButtonClick(event: IButtonClickEvent)
    {
        this.pickerActive = !this.pickerActive;
        this.requestUpdate();

        if(this.pickerActive) {
            this.setPickerFocus();
        }
    }

    protected onColorEditChange(event: IColorEditChangeEvent)
    {
        this.property.setValue(event.detail.color.toRGBArray());
    }

    protected onPropertyChange(value: number[])
    {
        this.color.fromArray(value);
        this.requestUpdate();
    }

    // if color picker is active and user clicks outside, close picker
    protected onPointerDown(event: PointerEvent)
    {
        if (!this.pickerActive) {
            return;
        }

        if (event.composedPath()[0] instanceof Node && this.contains(event.composedPath()[0] as Node)) {
            return;
        }

        this.pickerActive = false;
        this.requestUpdate();
    }

    protected onKeyDown(e: KeyboardEvent)
    {
        if (e.code === "Escape") {
            e.preventDefault();
            e.stopPropagation();
            this.pickerActive = false;
            this.requestUpdate();

            (this.getElementsByTagName("ff-button")[0] as HTMLElement).focus();
        }
        else if(e.code === "Tab") {
            const element = this.getElementsByTagName("ff-color-edit")[0] as HTMLElement;
            focusTrap(getFocusableElements(element) as HTMLElement[], e);
        }
    }
}