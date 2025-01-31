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

import { customElement, property, PropertyValues, html } from "@ff/ui/CustomElement";

import "@ff/ui/Button";
import "@ff/ui/ColorEdit";
import Notification from "@ff/ui/Notification";

import { focusTrap, getFocusableElements } from "client/utils/focusHelpers";


import PropertyBase from "./PropertyBase";

////////////////////////////////////////////////////////////////////////////////

@customElement("sv-property-color")
export default class PropertyColor extends PropertyBase
{
    type = "number";

    @property({attribute: false, type: Boolean})
    pickerActive :boolean = false;

    @property({type: Boolean})
    compact :boolean = false;

    @property({type: Boolean})
    floating :boolean = true;

    protected color: Color = new Color();

    get alphaEnabled(){
        return this.property.elementCount === 4;
    }

    constructor()
    {
        super();
    }

    protected firstConnected()
    {
        super.firstConnected();
        this.classList.add("sv-property-color");
    }

    protected disconnected()
    {
        this.pickerActive = false;
    }

    protected update(changedProperties: PropertyValues): void
    {

        if (changedProperties.has("property")) {
            if (this.property.type !== "number" || 4 < this.property.elementCount ||this.property.elementCount < 3) {
                throw new Error(`not a color property: '${this.property.path}'`);
            }
            const property = changedProperties.get("property") as Property;
            if (property) {
                property.off("value", this.onPropertyChange, this);
            }
            if (this.property) {
                this.property.on("value", this.onPropertyChange, this);
                this.color.fromArray(this.property.value);
            }
        }

        if(changedProperties.has("pickerActive")){
            if(this.pickerActive){
                this.setPickerFocus();
                document.addEventListener("pointerdown", this.onPointerDown, { capture: true, passive: true });
            }else{
                document.removeEventListener("pointerdown", this.onPointerDown, {capture: true});
            }
        }

        super.update(changedProperties);
    }

    protected render()
    {
        const property = this.property;
        const name = this.name || property.name;
        const color = this.color.toString(this.alphaEnabled);

        const colorEdit = html`<ff-color-edit .color=${this.color} @keydown=${e =>this.onKeyDown(e)} @change=${this.onColorChange}></ff-color-edit>`;
        const popupColorEdit = html`<ff-popup .keepVisible=${true} .anchor=${this} .position=${"anchor"} .align=${"end"} .justify=${"end"}>${colorEdit}</ff-popup>`

        return html`<label class="ff-label ff-off">${name}</label>
            <span class="sv-property-field">
                ${this.compact?null:html`<input ?disabled=${this.ariaDisabled === "true"} class="ff-input"
                        type="text"
                        .value=${color}
                        @change=${(ev)=>{
                            try{
                                this.color.setString(ev.target.value);
                                this.onColorChange();
                                ev.target.setCustomValidity("");
                            }catch(e){
                                ev.target.setCustomValidity(e.message);
                                Notification.show(`Not a valid color: ${ev.target.value}`, "warning", 1000);
                            }
                        }}
                    >`}
                <ff-button style="background-color: ${color}" title="${name} Color Picker" @click=${this.onButtonClick}></ff-button>
            </span>
            ${this.pickerActive ? (this.floating ? popupColorEdit : colorEdit) : null}
        `;
    }

    protected async setPickerFocus()
    {
        await this.updateComplete;
        const container = this.getElementsByTagName("ff-color-edit").item(0) as HTMLElement;
        (getFocusableElements(container)[0] as HTMLElement).focus();
    }
    
    protected onButtonClick(event: Event)
    {
        this.pickerActive = !this.pickerActive;
    }
    
    protected onColorChange()
    {

        this.property.setValue( (this.alphaEnabled)? this.color.toRGBAArray() : this.color.toRGBArray() );
    }

    protected onPropertyChange(value: number[])
    {
        this.color.fromArray(value);
        this.requestUpdate();
    }
    // if color picker is active and user clicks outside, close picker
    protected onPointerDown = (event: PointerEvent) => {
        if (!this.pickerActive) {
            return;
        }

        if (event.composedPath()[0] instanceof Node && this.contains(event.composedPath()[0] as Node)) {
            return;
        }
        this.pickerActive = false;
    }

    protected onKeyDown(e: KeyboardEvent)
    {
        if (e.code === "Escape" || e.code === "Enter") {
            e.preventDefault();
            e.stopPropagation();
            this.pickerActive = false;

            (this.getElementsByTagName("ff-button")[0] as HTMLElement).focus();
        }
        else if(e.code === "Tab") {
            const element = this.getElementsByTagName("ff-color-edit")[0] as HTMLElement;
            focusTrap(getFocusableElements(element) as HTMLElement[], e);
        }
    }
}