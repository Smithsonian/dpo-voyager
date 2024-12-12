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

import Property from "@ff/graph/Property";

import { customElement, property, PropertyValues, html } from "@ff/ui/CustomElement";

import "@ff/ui/LinearSlider";
import { ILinearSliderChangeEvent } from "@ff/ui/LinearSlider";
import PropertyBase from "./PropertyBase";

////////////////////////////////////////////////////////////////////////////////

@customElement("sv-property-slider")
export default class PropertySlider extends PropertyBase
{
    type = "number";

    @property({ type: Number })
    min: number = undefined;

    @property({ type: Number })
    max: number = undefined;

    protected firstConnected()
    {
        super.firstConnected();
        this.classList.add("sv-property-slider");
    }

    protected update(changedProperties: PropertyValues): void
    {

        if (changedProperties.has("property")) {
            const property = changedProperties.get("property") as Property;
            if (property) {
                property.off("value", this.onUpdate, this);
            }
            if (this.property) {
                this.property.on("value", this.onUpdate, this);
            }
        }

        super.update(changedProperties);
    }

    protected render()
    {
        const property = this.property;
        const name = this.name || property.name;
        const value = property.getValidatedValue();

        const min = isFinite(this.min) ? this.min : property.schema.min;
        const max = isFinite(this.max) ? this.max : property.schema.max;

        const v = (value - min) / (max - min);

        return html`<label id="${name}-label" class="ff-label ff-off">${name}</label>
            <ff-linear-slider class="${(this.ariaDisabled==="true")? "ff-off":"ff-on"}" aria-labelledby="${name}-label" aria-valuemin=${min.toString()} aria-valuemax=${max.toString()} aria-valuenow=${value.toFixed(3)} role="slider" .value=${v} @keydown=${this.onKeyDown} @change=${this.onSliderChange}></ff-linear-slider>`;
    }

    protected onSliderChange(event: ILinearSliderChangeEvent)
    {
        const property = this.property;

        const min = isFinite(this.min) ? this.min : property.schema.min;
        const max = isFinite(this.max) ? this.max : property.schema.max;

        const value = min + event.detail.value * (max - min);
        property.setValue(value);
    }

    protected onKeyDown(event: KeyboardEvent)
    {
        const property = this.property;

        if(event.code === "ArrowRight" || event.code === "ArrowUp" || event.code === "PageUp") {
            property.setValue(this.clamp(event.code === "PageUp" ? property.value + 0.1 : property.value + 0.01));
        }
        else if(event.code === "ArrowLeft" || event.code === "ArrowDown" || event.code === "PageDown") {
            property.setValue(this.clamp(event.code === "PageDown" ? property.value - 0.1 : property.value - 0.01));
        }
    }

    protected clamp(input: number) : number
    {
        const property = this.property;
        const min = isFinite(this.min) ? this.min : property.schema.min;
        const max = isFinite(this.max) ? this.max : property.schema.max;
        
        return Math.min(Math.max(input, min), max);
    }
}