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
	
import {live} from "lit-html/directives/live";

import Property from "@ff/graph/Property";
import { customElement, property, PropertyValues, html } from "@ff/ui/CustomElement";

import "@ff/ui/Button";
import { IButtonClickEvent } from "@ff/ui/Button";

import PropertyBase from "./PropertyBase";

////////////////////////////////////////////////////////////////////////////////

@customElement("sv-property-options")
export default class PropertyOptions extends PropertyBase
{
    type = "number";
    @property({ attribute: false })
    options: string[] = null;

    @property({ attribute: false })
    indexMap: number[] = null;


    @property({type: Boolean, reflect: true})
    dropdown :boolean = false;

    protected firstConnected()
    {
        super.firstConnected();
        this.classList.add("sv-property-options");
    }

    protected update(changedProperties: PropertyValues): void
    {
        if (changedProperties.has("property")) {
            if (!this.property) {
                throw new Error("missing property attribute");
            }
    
            if (!this.property.schema.options) {
                throw new Error("not an options property");
            }
            const property = changedProperties.get("property") as Property;
            if (property) {
                property.off("value", this.onUpdate, this);
                property.off("change", this.onUpdate, this);
            }
            if (this.property) {
                this.property.on("value", this.onUpdate, this);
                this.property.on("change", this.onUpdate, this);
            }
        }

        super.update(changedProperties);
    }
    protected render()
    {
        if(this.dropdown){
            return this.renderDropdown();
        }else{
            return this.renderButtons();
        }
    }

    protected renderDropdown(){
        const property = this.property;
        const indexMap = this.indexMap;
        const name = this.name || property.name;
        const options = this.options || property.schema.options;
        const value = property.value;
        const language = this.language;

        let optionsList;
        if (indexMap) {
            optionsList = indexMap.map(index =>
                html`<option value=${index} ?selected=${this.isSelected(index)}>${language ? language.getLocalizedString(options[index]) : options[index]}</option>`);
        }
        else {
            optionsList = options.map((option, index) =>
                option? html`<option value=${index} ?selected=${this.isSelected(index)}>${language ? language.getLocalizedString(option) : option}</option>`:null)
        }

        return html`
            <label class="ff-label ff-off">${name}</label>
            <select ?disabled=${this.ariaDisabled === "true"} ?multiple=${property.isMulti()} .value=${live(value)} class="sv-property-field" @change=${(e)=>{
                this.property.setValue(parseInt(e.target.value))
            }}>
                ${optionsList}
            </select>
        `;
    }


    protected renderButtons()
    {
        const property = this.property;
        const indexMap = this.indexMap;
        const name = this.name || property.name;
        const options = this.options || property.schema.options;
        const value = property.value;
        const language = this.language;

        let buttons;
        if (indexMap) {
            buttons = indexMap.map(index =>
                html`<ff-button role="radio" aria-checked=${this.isSelected(index)?"true":"false"} ?selected=${this.isSelected(index)} index=${index} .text=${language ? language.getLocalizedString(options[index]) : options[index]} @click=${this.onButtonClick}>
                    </ff-button>`);
        }
        else {
            buttons = options.map((option, index) =>
                option?html`<ff-button role="radio" aria-checked=${this.isSelected(index)?"true":"false"} ?selected=${this.isSelected(index)} index=${index} .text=${language ? language.getLocalizedString(option) : option}  @click=${this.onButtonClick}>
                    </ff-button>`:null)
        }

        return html`
            <label class="ff-label ff-off">${name}</label>
            <div class="sv-options-buttons" role="radiogroup" @keydown=${e =>this.onKeyDown(e)} title=${name} class="sv-options">
                ${buttons}
            </div>`;
    }


    isSelected(index: number){
        if(this.property.isMulti()){
            return this.property.value.includes(index);
        }else{
            return this.property.value == index;
        }
    }


    protected onButtonClick(event: IButtonClickEvent)
    {
        const value = event.target.index;
        if(this.property.isMulti()){
            let selection = this.property.value.slice();
            let valueIndex = selection.indexOf(value);
            if(valueIndex !== -1){
                selection = selection.filter(v => v !== value);
            }else{
                selection.push(value);
            }
            this.property.setValue(selection);
        }else{
            this.property.setValue(value);
        }
    }

    protected onKeyDown(e: KeyboardEvent)
    {
        if(e.code === "ArrowUp" || e.code === "ArrowLeft") {
            const options = this.getElementsByTagName("ff-button");
            const currentIdx = Array.from(options).findIndex(option => e.target === option);
            if(currentIdx > 0) {
                options[currentIdx].setAttribute("tabIndex", "-1");
                options[currentIdx-1].setAttribute("tabIndex", "0");
                (options[currentIdx-1] as HTMLElement).focus();
            }
        }
        else if(e.code === "ArrowDown" || e.code === "ArrowRight") {
            const options = this.getElementsByTagName("ff-button");
            const currentIdx = Array.from(options).findIndex(option => e.target === option);
            if(currentIdx < options.length-1) {
                options[currentIdx].setAttribute("tabIndex", "-1");
                options[currentIdx+1].setAttribute("tabIndex", "0");
                (options[currentIdx+1] as HTMLElement).focus();
            }
        }
        else if(e.code === "Tab") {
            this.addEventListener('blur', this.tabReset, { once: true, capture: true });
        }
    }

    focus() {
        const options = this.getElementsByTagName("ff-button");
        const currentIdx = Math.max(Array.from(options).findIndex(option => (option as HTMLElement).tabIndex === 0), 0);

        (options[currentIdx] as HTMLElement).focus();
    }

    // resets tabIndex if needed
    protected tabReset(e: FocusEvent) {
        const options = this.getElementsByTagName("ff-button");
        const optionsArray = Array.from(options);
        const activeIdx = optionsArray.findIndex(option => (option as HTMLElement).tabIndex === 0);
        const selectedIdx = optionsArray.findIndex(option => option.getAttribute("aria-checked") === "true");
        if(activeIdx != selectedIdx) {
            options[activeIdx].setAttribute("tabIndex", "-1");
            const currentIdx = selectedIdx > -1 ? selectedIdx : 0;
            options[currentIdx].setAttribute("tabIndex", "0");
        }
    }
}