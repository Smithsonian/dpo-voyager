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

import "@ff/scene/ui/PropertyField";
import "@ff/ui/ColorButton";
import { IColorEditChangeEvent } from "@ff/ui/ColorButton";

import CustomElement, { customElement, property, html, PropertyValues } from "@ff/ui/CustomElement";

import "../PropertyColor";
import "../PropertyBoolean";
import "../PropertyString";
import "../PropertySlider";
import "../PropertyNumber";
import "../PropertyOptions";
import "../PropertyEvent";

////////////////////////////////////////////////////////////////////////////////

const _defaultLabels = [ "X", "Y", "Z", "W" ];

@customElement("sv-property-view")
export default class PropertyView extends CustomElement
{
    @property({ attribute: false })
    property: Property = null;

    @property()
    label: string = undefined;


    @property({ type: Boolean })
    commitonly = false;

    protected firstConnected()
    {
        if (!this.property) {
            throw new Error("property not set");
        }

        this.classList.add("sv-property-view");
    }

    protected onPropertyChange()
    {
        console.log("PROPERTY CHANGE");
    }

    protected render()
    {
        const property = this.property;
        const schema = property.schema;
        const label = this.label !== undefined ? this.label : property.path.split(".").pop();

        if(property.isArray() && property.type !== "number"){
            console.error("Unsupported property : ", property);
            return null;
        }

        if(property.type === "number" && property.schema.semantic === "color"){
            return html`<sv-property-color name=${label} .property=${property}></sv-property-color>`;
        }else if (property.type === "number" && property.isArray()) {
            let fields = [];
            for (let i = 0; i < property.elementCount; ++i) {
                const fieldLabel = property.schema.labels?.[i] ?? _defaultLabels[i];
                fields.push(html`<sv-property-number name=${fieldLabel} .index=${i} .property=${property}></sv-property-number>`);
            }
            const headerElement = label ? html`<div class="sv-property-name">${label}</div>` : null;
            return html`${headerElement}<div class="sv-property-group">${fields}</div>`;
        }else if (schema.event) {
            return html`<sv-property-event name=${label} .property=${property}></sv-property-event>`;
        }else if (schema.options) {
            return html`<sv-property-options dropdown name=${label} .property=${property}></sv-property-options>`;
        }else if(property.type === "boolean"){
            return html`<sv-property-boolean name=${label} .property=${property}></sv-property-boolean>`;
        }else if(property.type === "string"){
            return html`<sv-property-string name=${label} .property=${property}></sv-property-string>`
        }else if(property.type === "number"){
            return html`<sv-property-number name=${label} .property=${property}></sv-property-number>`
        }else{
            console.warn("Unhandled property :", property.name);
            return html`<div class="sv-property-name">${label}</div><div class="sv-property-group">${property.value} (not editable)</div>`;
        }

    }

}
