/**
 * 3D Foundation Project
 * Copyright 2025 Smithsonian Institution
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

import "@ff/ui/Button";

import PropertyBase from "./PropertyBase";

////////////////////////////////////////////////////////////////////////////////

@customElement("sv-property-tags")
export default class PropertyTags extends PropertyBase
{
    type = "string";

    @property({ attribute: false })
    tagCloud: string[] = [];

    @property({ attribute: false })
    protected inputValue = "";

    protected firstConnected()
    {
        super.firstConnected();
        this.classList.add("sv-property-tags");
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

    protected get selectedTags(): string[] {
        return this.property?.value?.split(",")
            .map((t: string) => t.trim()).filter(Boolean) || [];
    }

    protected get availableTags(): string[] {
        return this.tagCloud.filter(t => !this.selectedTags.includes(t));
    }

    protected onAddTag(tag: string) {
        const trimmedTag = tag.trim();
        if (!trimmedTag || this.selectedTags.includes(trimmedTag)) {
            this.inputValue = "";
            this.requestUpdate();
            return;
        }
        const newTags = [...this.selectedTags, trimmedTag];
        this.property.setValue(newTags.join(", "));
        this.inputValue = "";
        this.requestUpdate();
    }

    protected onRemoveTag(tag: string) {
        const newTags = this.selectedTags.filter(t => t !== tag);
        this.property.setValue(newTags.join(", "));
    }

    protected onInputKeyDown = (e: KeyboardEvent) => {
        if (e.key === "Enter") {
            e.preventDefault();
            this.onAddTag(this.inputValue);
        }
    }

    protected onInput = (e: Event) => {
        this.inputValue = (e.target as HTMLInputElement).value;
    }

    protected onSelectChange = (e: Event) => {
        const select = e.target as HTMLSelectElement;
        const value = select.value;
        if (value) {
            this.onAddTag(value);
            select.value = "";
        }
    }

    protected render()
    {
        const property = this.property;
        if (!property) {
            return html``;
        }

        const name = this.name || property.name;
        const selectedTags = this.selectedTags;
        const availableTags = this.availableTags;
        const language = this.language;

        return html`${name ? html`<label class="ff-label ff-off">${name}</label>` : null}
            <div class="sv-tags-container">
                <div class="sv-tags-selected">
                    ${selectedTags.map(tag => html`<ff-button class="sv-tag-chip" text=${tag} icon="close" title=${language ? language.getLocalizedString("Remove tag") : "Remove tag"} @click=${() => this.onRemoveTag(tag)}></ff-button>`)}
                </div>
                <select class="sv-property-field" ?disabled=${this.ariaDisabled === "true"} @change=${this.onSelectChange}>
                    <option value="" disabled selected>${language ? language.getLocalizedString("Select...") : "Select..."}</option>
                    ${availableTags.map(tag => html`<option value=${tag}>${tag}</option>`)}
                </select>
                <input type="text" placeholder=${language ? language.getLocalizedString("New tag...") : "New tag..."} class="sv-property-field" .value=${this.inputValue} @input=${this.onInput} @keydown=${this.onInputKeyDown} ?disabled=${this.ariaDisabled === "true"}>
            </div>`;
    }
}