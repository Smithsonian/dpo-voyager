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

import "@ff/ui/graph/PropertyField";

import CustomElement, { customElement, property, html } from "@ff/ui/CustomElement";

////////////////////////////////////////////////////////////////////////////////

const _defaultLabels = [ "X", "Y", "Z", "W" ];

@customElement("sv-property-view")
export default class PropertyView extends CustomElement
{
    @property({ attribute: false })
    property: Property = null;

    @property()
    label: string = undefined;

    protected firstConnected()
    {
        if (!this.property) {
            throw new Error("property not set");
        }

        this.setStyle({
            display: "flex",
            flexDirection: "column",
            overflow: "hidden"
        });

        this.classList.add("sv-property-view");
    }

    protected render()
    {
        const property = this.property;
        const label = this.label !== undefined ? this.label : property.path.split(".").pop();
        const headerElement = html`<div class="sv-property-name">${label}</div>`;

        if (property.isArray()) {
            if (property.elementCount > 4) {
                return;
            }

            let fields = [];
            for (let i = 0; i < property.elementCount; ++i) {
                fields.push(this.renderField(i));
            }
            return html`${headerElement}${fields}`;
        }

        return html`${headerElement}${this.renderField(-1)}`;
    }

    protected renderField(index: number)
    {
        const property = this.property;
        const labels = property.schema.labels || _defaultLabels;
        const labelElement = html`<div class="sv-field-label">${index >= 0 ? labels[index] : ""}</div>`;

        return html`<div class="ff-flex-row sv-field-row">
            ${labelElement}
            <ff-property-field .property=${property} .index=${index}></ff-property-field>
        </div>`;
    }
}
