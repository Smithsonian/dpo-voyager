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
import { customElement, PropertyValues, html, property } from "@ff/ui/CustomElement";

import "@ff/ui/Button";
import { IButtonClickEvent } from "@ff/ui/Button";
import PropertyBase from "./PropertyBase";

////////////////////////////////////////////////////////////////////////////////

@customElement("sv-property-event")
export default class PropertyEvent extends PropertyBase
{
    @property({type: String})
    icon :string;

    protected firstConnected()
    {
        super.firstConnected();
        this.classList.add("sv-property-event");
    }

    protected update(changedProperties: PropertyValues): void
    {
        if (changedProperties.has("property")) {
            if (!this.property) {
                throw new Error("missing property attribute");
            }
            if (!this.property.schema.event) {
                throw new Error(`not an event property: '${this.property.path}'`);
            }
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
        const text = this.text;

        return html`<label id="${name}-label" class="ff-label ff-off">${name}</label>
            <div class="sv-options">
                <ff-button ?disabled=${this.ariaDisabled === "true"} aria-labelledby="${name}-label" icon="zoom" .text=${text} @click=${this.onButtonClick}></ff-button>
            </div>`;
    }

    protected onButtonClick(event: IButtonClickEvent)
    {
        this.property.set();
    }
}