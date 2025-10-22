/**
 * DateTime properties for both date/time and timezone selection.
 * 
 * @author Carsten Schnober <c.schnober@esciencecenter.nl>
 * @license Apache-2.0
 */

import Property from "@ff/graph/Property";
import { customElement, html, property, PropertyValues } from "@ff/ui/CustomElement";
import { DateTime } from "luxon";
import moment from "moment-timezone";

import PropertyBase from "./PropertyBase";

@customElement("sv-property-datetime")
export default class PropertyDateTime extends PropertyBase {
  type = "object";

  @property({ attribute: false })
  property: Property<DateTime> = null;

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
    const datetime: string = (event.target as HTMLInputElement).value;
    if (datetime) {
      const currentZone: string = this.property.value.zoneName || "UTC";  // retain timezone

      this.property.setValue(DateTime.fromISO(datetime, { zone: currentZone }));
    }
  };

  protected render() {
    const name: string = this.name || this.property.name;
    const inputValue: string = this.property.value.toISO(
      { suppressSeconds: true, suppressMilliseconds: true, includeOffset: false }
    );

    return html`
      <label class="ff-label ff-off">${name}</label>
      <input ?disabled=${this.ariaDisabled === "true"} type="datetime-local" class="sv-property-field ff-input" .value=${inputValue} 
        @change=${this.onChange} @focus=${(e) => { e.target.select(); }} @keypress=${(e) => { if (e.key === "Enter") { e.target.blur(); } }} />
      `;
  }
}

@customElement("sv-property-timezone")
export class PropertyTimezone extends PropertyBase {
  type = "object";

  @property({ attribute: false })
  property: Property<DateTime> = null;

  @property({ type: String })
  name = "";

  protected firstConnected() {
    super.firstConnected();
    this.classList.add("sv-property-timezone");
  }

  protected update(changedProperties: PropertyValues): void {
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
    const newZone = (event.target as HTMLSelectElement).value;
    this.property.setValue(this.property.value.setZone(newZone));
  };

  protected render() {
    const property = this.property;
    const name = this.name || property.name;
    const dateTimeValue = property.value as DateTime;

    const currentZone: string = dateTimeValue?.zoneName || "UTC";

    return html`
      <label class="ff-label ff-off">${name}</label>
      <select ?disabled=${this.ariaDisabled === "true"} class="sv-property-field ff-input" .value=${currentZone} @change=${this.onChange} >
        ${moment.tz.names().map((tz) => html`<option .value=${tz} ?selected=${tz === currentZone}>${tz}</option>`)}
      </select>`;
  }
}
