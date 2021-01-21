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

@customElement("sv-property-options")
export default class PropertyOptions extends CustomElement
{
    @property({ attribute: false })
    property: Property = null;

    @property({ type: String })
    name = "";

    @property({ attribute: false })
    options: string[] = null;

    @property({ attribute: false })
    indexMap: number[] = null;

    @property({ attribute: false })
    language: CVLanguageManager = null;

    protected firstConnected()
    {
        this.classList.add("sv-property-view", "sv-property-options");
    }

    protected update(changedProperties: PropertyValues): void
    {
        if (!this.property) {
            throw new Error("missing property attribute");
        }

        if (this.property.type !== "number" || !this.property.schema.options) {
            throw new Error("not an options property");
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
        const indexMap = this.indexMap;
        const name = this.name || property.name;
        const options = this.options || property.schema.options;
        const value = property.value;
        const language = this.language;

        let buttons;
        if (indexMap) {
            buttons = indexMap.map(index =>
                html`<ff-button .text=${language ? language.getLocalizedString(options[index]) : options[index]} .index=${index} .selectedIndex=${value} @click=${this.onButtonClick}>
                    </ff-button>`);
        }
        else {
            buttons = options.map((option, index) =>
                html`<ff-button .text=${language ? language.getLocalizedString(option) : option} .index=${index} .selectedIndex=${value} @click=${this.onButtonClick}>
                    </ff-button>`)
        }

        return html`<label class="ff-label ff-off">${name}</label><div class="sv-options">${buttons}</div>`;
    }

    protected onButtonClick(event: IButtonClickEvent)
    {
        const value = event.target.index;
        this.property.setValue(value);
    }
}