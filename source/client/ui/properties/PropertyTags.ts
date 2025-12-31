/**
* Funded by the Netherlands eScience Center in the context of the
* [Dynamic 3D]{@link https://research-software-directory.org/projects/dynamic3d} project.
*
* @author Carsten Schnober <c.schnober@esciencecenter.nl>
*/

import Property from "@ff/graph/Property";
import CustomElement, { customElement, property, PropertyValues, html } from "@ff/ui/CustomElement";

import PropertyBase from "./PropertyBase";

////////////////////////////////////////////////////////////////////////////////

@customElement("sv-property-tags")
export default class PropertyTags extends PropertyBase
{
    type = "object";
    @property({ attribute: false })
    property: Property = null;

    @property({ type: String })
    name = "";

    @property({ type: String })
    inputValue = "";

    protected firstConnected()
    {
        super.firstConnected();
        this.classList.add("sv-property-tags");
    }
    
    protected update(changedProperties: PropertyValues): void
    {
        if (!this.property) {
            throw new Error("missing property attribute");
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

    protected onAddTag = (event: KeyboardEvent) => {
        if (event.key === "Enter") {
            event.preventDefault();
            const input = event.target as HTMLInputElement;
            const tag = input.value.trim();
            
            if (tag) {
                const tags = this.property.value as Set<string>;
                tags.add(tag);
                this.property.setValue(new Set(tags));
                this.inputValue = "";
                input.value = "";
            }
        }
    }

    protected onRemoveTag = (tag: string) => {
        const tags = this.property.value as Set<string>;
        tags.delete(tag);
        this.property.setValue(new Set(tags));
    }

    protected render()
    {
        const property = this.property;
        const name = this.name || property.name;
        const tags = property.value as Set<string> || new Set<string>();
        const tagArray = Array.from(tags);

        return html`
            ${name ? html`<label class="ff-label ff-off">${name}</label>` : null}
            <div class="sv-tags-container sv-property-field">
                <div class="sv-tags-list">
                    ${tagArray.map(tag => html`
                        <div class="sv-tag">
                            <span class="sv-tag-text">${tag}</span>
                            <button class="sv-tag-remove" @click=${() => this.onRemoveTag(tag)} aria-label="Remove tag">×</button>
                        </div>
                    `)}
                </div>
                <input 
                    type="text" 
                    class="sv-tags-input ff-input"
                    placeholder="Add tag (press Enter)" 
                    ?disabled=${this.ariaDisabled === "true"}
                    @keypress=${this.onAddTag}
                />
            </div>
        `;
    }
}
