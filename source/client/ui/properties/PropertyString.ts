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

import PropertyBase from "./PropertyBase";

////////////////////////////////////////////////////////////////////////////////

@customElement("sv-property-string")
export default class PropertyString extends PropertyBase
{
    type = "string";
    @property({ attribute: false })
    property: Property = null;

    @property({ type: String })
    name = "";

    protected firstConnected()
    {
        super.firstConnected();
        this.classList.add( "sv-property-string");
    }
    
    protected update(changedProperties: PropertyValues): void
    {
        if (!this.property) {
            throw new Error("missing property attribute");
        }

        if (this.property.type !== "string") {
            throw new Error(`not a string property: '${this.property.path}'`);
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

    protected onChange = (event: Event) => {
        const value = (event.target as HTMLInputElement).value;
        this.property.setValue(value);
    }

    protected render()
    {
        const property = this.property;
        const name = this.name || property.name;
        const text = property.value;

        return html`${name? html`<label class="ff-label ff-off">${name}</label>`:null}
            <input ?disabled=${this.ariaDisabled === "true"} type="text" class="sv-property-field ff-input"
                .value=${text} 
                @change=${this.onChange}
                @focus=${(e)=>{ e.target.select();}}}
                @keypress=${(e)=>{if(e.key === "Enter"){e.target.blur();}}}
            >
        `;
    }
}