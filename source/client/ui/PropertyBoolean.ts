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

import "@ff/ui/Button";
import { IButtonClickEvent } from "@ff/ui/Button";
import CVLanguageManager from "client/components/CVLanguageManager";

////////////////////////////////////////////////////////////////////////////////

@customElement("sv-property-boolean")
export default class PropertyBoolean extends CustomElement
{
    @property({ attribute: false })
    property: Property = null;

    @property({ type: String })
    name = "";

    @property({ attribute: false })
    text: string | string[] = null;

    @property({ attribute: false })
    language: CVLanguageManager = null;

    @property({ type: Boolean })
    disabled = false;

    @property({ type: String })
    customLabelStyle = "";

    protected firstConnected()
    {
        this.classList.add("sv-property-view", "sv-property-boolean");
    }

    protected update(changedProperties: PropertyValues): void
    {
        if (!this.property) {
            throw new Error("missing property attribute");
        }

        if (this.property.type !== "boolean") {
            throw new Error("not a boolean property");
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
        const labelName = name.replace(/\s/g, '');
        const text = this.text;
        const language = this.language;
        const customClass = this.customLabelStyle;

        let label = property.value ?
            Array.isArray(text) ? text[1] : (text || "On") :
            Array.isArray(text) ? text[0] : (text || "Off");

        return html`<label id="${labelName}-label" class="ff-label ff-off  ${customClass}">${name}</label>
            <ff-button role="switch" aria-labelledby="${labelName}-label" aria-checked=${property.value} .text=${language ? language.getLocalizedString(label) : label} ?disabled=${this.disabled} ?selected=${property.value} @click=${this.onButtonClick}></ff-button>`;
    }

    protected onButtonClick(event: IButtonClickEvent)
    {
        this.property.setValue(!this.property.value);
    }
}