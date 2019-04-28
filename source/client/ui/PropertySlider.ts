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

import CustomElement, { customElement, property, PropertyValues, html } from "@ff/ui/CustomElement";

import "@ff/ui/LinearSlider";
import { ILinearSliderChangeEvent } from "@ff/ui/LinearSlider";

////////////////////////////////////////////////////////////////////////////////

@customElement("sv-property-slider")
export default class PropertySlider extends CustomElement
{
    @property({ attribute: false })
    property: Property = null;

    @property({ type: String })
    name = "";

    @property({ type: Number })
    min: number = undefined;

    @property({ type: Number })
    max: number = undefined;

    protected firstConnected()
    {
        super.firstConnected();
        this.classList.add("sv-property-view", "sv-property-slider");
    }

    protected update(changedProperties: PropertyValues): void
    {
        if (!this.property) {
            throw new Error("missing property attribute");
        }

        if (this.property.type !== "number") {
            throw new Error(`not a number property: '${this.property.path}'`);
        }

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

        return html`<label class="ff-label ff-off">${name}</label>
            <ff-linear-slider .value=${v} @change=${this.onSliderChange}></ff-linear-slider>`;
    }

    protected onSliderChange(event: ILinearSliderChangeEvent)
    {
        const property = this.property;

        const min = isFinite(this.min) ? this.min : property.schema.min;
        const max = isFinite(this.max) ? this.max : property.schema.max;

        const value = min + event.detail.value * (max - min);
        property.setValue(value);
    }
}