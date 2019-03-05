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

import Property from "@ff/graph/Property";

import CustomElement, { customElement, property, html } from "@ff/ui/CustomElement";

import "@ff/ui/LinearSlider";
import { ILinearSliderChangeEvent } from "@ff/ui/LinearSlider";

////////////////////////////////////////////////////////////////////////////////

@customElement("sv-property-slider")
export default class PropertySlider extends CustomElement
{
    @property({ attribute: false })
    property: Property = null;

    protected firstConnected()
    {
        this.classList.add("sv-property-view", "sv-property-slider");
    }

    protected connected()
    {
        this.property.on("value", this.performUpdate, this);
    }

    protected disconnected()
    {
        this.property.off("value", this.performUpdate, this);
    }

    protected render()
    {
        const property = this.property;
        const name = property.name;
        const value = property.getValidatedValue();
        const schema = property.schema;
        const v = (value - schema.min) / (schema.max - schema.min);

        return html`<label class="ff-label ff-off">${name}</label>
            <ff-linear-slider .value=${v} @change=${this.onSliderChange}></ff-linear-slider>`;
    }

    protected onSliderChange(event: ILinearSliderChangeEvent)
    {
        const property = this.property;
        const schema = property.schema;

        const value = schema.min + event.detail.value * (schema.max - schema.min);
        property.setValue(value);
    }
}