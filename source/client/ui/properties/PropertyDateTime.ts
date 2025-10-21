/**
 * @author Carsten Schnober <c.schnober@esciencecenter.nl>
 * @license Apache-2.0
 */

import Property from "@ff/graph/Property";
import { customElement, property, PropertyValues, html } from "@ff/ui/CustomElement";
import { DateTime } from "luxon";

import PropertyBase from "./PropertyBase";

////////////////////////////////////////////////////////////////////////////////

@customElement("sv-property-datetime")
export default class PropertyDateTime extends PropertyBase {
  type = "object";

  @property({ attribute: false })
  property: Property = null;

  @property({ type: String })
  name = "";

  protected firstConnected() {
    super.firstConnected();
    this.classList.add("sv-property-datetime");
  }

  protected update(changedProperties: PropertyValues): void {
    if (!this.property) {
      throw new Error("missing property attribute");
    }

    if (this.property.type !== "object") {
      throw new Error(`not an object property for datetime: '${this.property.path}'`);
    }

    if (this.property.schema.semantic !== "datetime") {
      throw new Error(`not a datetime property: '${this.property.path}'`);
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
    const datetime: string = (event.target as HTMLInputElement).value; // yyyy-MM-ddTHH:mm
    if (datetime) {
      this.property.setValue(DateTime.fromISO(datetime));
    }
  };

  private toInputValue(dt?: DateTime): string {
    return (dt && DateTime.isDateTime(dt))
      ? dt.toFormat("yyyy-MM-dd'T'HH:mm")
      : "";
  }

  protected render() {
    const property = this.property;
    const name = this.name || property.name;
    const value = property.value as DateTime;
    const inputValue = this.toInputValue(value);

    return html`${name ? html`<label class="ff-label ff-off">${name}</label>` : null}
      <input ?disabled=${this.ariaDisabled === "true"} type="datetime-local" class="sv-property-field ff-input" .value=${inputValue} @change=${this.onChange} @focus=${(e) => { e.target.select(); }} @keypress=${(e) => { if (e.key === "Enter") { e.target.blur(); } }} />`;
  }
}
