/**
 * @author Carsten Schnober <c.schnober@esciencecenter.nl>
 * @license Apache-2.0
 */

import Property from "@ff/graph/Property";
import {
  customElement,
  property,
  PropertyValues,
  html,
} from "@ff/ui/CustomElement";

import PropertyBase from "./PropertyBase";

////////////////////////////////////////////////////////////////////////////////

@customElement("sv-property-date")
export default class PropertyDate extends PropertyBase {
  type = "object";

  @property({ attribute: false })
  property: Property = null;

  @property({ type: String })
  name = "";

  protected firstConnected() {
    super.firstConnected();
    this.classList.add("sv-property-date");
  }

  protected update(changedProperties: PropertyValues): void {
    if (!this.property) {
      throw new Error("missing property attribute");
    }

    if (this.property.type !== "object") {
      throw new Error(
        `not an object property for date: '${this.property.path}'`,
      );
    }

    // Check if the property is actually a Date object
    if (this.property.schema.semantic !== "date") {
      throw new Error(`not a date property: '${this.property.path}'`);
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
    if (value) {
      // Convert the input string to a Date object
      const date = new Date(value);
      this.property.setValue(date);
    } else {
      // If empty, set to null or current date
      this.property.setValue(new Date());
    }
  };

  protected render() {
    const property = this.property;
    const name = this.name || property.name;
    const dateValue = property.value as Date;

    // Convert Date to YYYY-MM-DD format for input[type="date"]
    let inputValue = "";
    if (dateValue && dateValue instanceof Date) {
      const year = dateValue.getFullYear();
      const month = String(dateValue.getMonth() + 1).padStart(2, "0");
      const day = String(dateValue.getDate()).padStart(2, "0");
      inputValue = `${year}-${month}-${day}`;
    }

    return html`${name
        ? html`<label class="ff-label ff-off">${name}</label>`
        : null}
      <input
        ?disabled=${this.ariaDisabled === "true"}
        type="date"
        class="sv-property-field ff-input"
        .value=${inputValue}
        @change=${this.onChange}
        @focus=${(e) => {
          e.target.select();
        }}
        @keypress=${(e) => {
          if (e.key === "Enter") {
            e.target.blur();
          }
        }}
      /> `;
  }
}
