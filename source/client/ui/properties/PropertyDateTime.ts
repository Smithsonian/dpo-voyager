/**
* Funded by the Netherlands eScience Center in the context of the
* [Dynamic 3D]{@link https://research-software-directory.org/projects/dynamic3d} project
* and the "Paradata in 3D Scholarship" workshop {@link https://research-software-directory.org/projects/paradata-in-3d-scholarship}
*
* @author Carsten Schnober <c.schnober@esciencecenter.nl>
*/

import Property from "@ff/graph/Property";
import { customElement, html, property, PropertyValues } from "@ff/ui/CustomElement";
import { DateTime } from "luxon";

import PropertyBase from "./PropertyBase";

const UTC_OFFSETS = [
  { label: "UTC-12:00", offset: -12 },
  { label: "UTC-11:00", offset: -11 },
  { label: "UTC-10:00", offset: -10 },
  { label: "UTC-09:00", offset: -9 },
  { label: "UTC-08:00", offset: -8 },
  { label: "UTC-07:00", offset: -7 },
  { label: "UTC-06:00", offset: -6 },
  { label: "UTC-05:00", offset: -5 },
  { label: "UTC-04:00", offset: -4 },
  { label: "UTC-03:00", offset: -3 },
  { label: "UTC-02:00", offset: -2 },
  { label: "UTC-01:00", offset: -1 },
  { label: "UTC+00:00", offset: 0 },
  { label: "UTC+01:00", offset: 1 },
  { label: "UTC+02:00", offset: 2 },
  { label: "UTC+03:00", offset: 3 },
  { label: "UTC+04:00", offset: 4 },
  { label: "UTC+05:00", offset: 5 },
  { label: "UTC+06:00", offset: 6 },
  { label: "UTC+07:00", offset: 7 },
  { label: "UTC+08:00", offset: 8 },
  { label: "UTC+09:00", offset: 9 },
  { label: "UTC+10:00", offset: 10 },
  { label: "UTC+11:00", offset: 11 },
  { label: "UTC+12:00", offset: 12 },
  { label: "UTC+13:00", offset: 13 },
  { label: "UTC+14:00", offset: 14 },
];

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
    const offsetStr = (event.target as HTMLSelectElement).value;
    const offset: number = parseFloat(offsetStr);
    const zoneLabel: string = `UTC${offset >= 0 ? '+' : ''}${offset}`;
    this.property.setValue(this.property.value.setZone(zoneLabel));
  };

  protected render() {
    const property = this.property;
    const name = this.name || property.name;
    const dateTimeValue = property.value as DateTime;

    const currentOffset: number = dateTimeValue?.offset ? dateTimeValue.offset / 60 : 0;

    return html`
      <label class="ff-label ff-off">${name}</label>
      <select ?disabled=${this.ariaDisabled === "true"} class="sv-property-field ff-input" .value=${currentOffset.toString()} @change=${this.onChange} >
        ${UTC_OFFSETS.map((tz) => html`<option .value=${tz.offset.toString()} ?selected=${tz.offset === currentOffset}>${tz.label}</option>`)}
      </select>`;
  }
}
