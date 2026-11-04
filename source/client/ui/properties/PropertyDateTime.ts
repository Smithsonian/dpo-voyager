/**
* Funded by the Netherlands eScience Center in the context of the
* [Dynamic 3D]{@link https://research-software-directory.org/projects/dynamic3d} project
* and the "Paradata in 3D Scholarship" workshop {@link https://research-software-directory.org/projects/paradata-in-3d-scholarship}
*
* @author Carsten Schnober <c.schnober@esciencecenter.nl>
*/

import Property from "@ff/graph/Property";
import { customElement, html, property, PropertyValues } from "@ff/ui/CustomElement";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import PropertyBase from "./PropertyBase";

dayjs.extend(utc);

@customElement("sv-property-datetime")
export default class PropertyDateTime extends PropertyBase {
  type = "object";

  @property({ attribute: false })
  property: Property<dayjs.Dayjs> = null;

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
    const inputValue = (event.target as HTMLInputElement).value;
    const dateTime = dayjs.utc(`${inputValue}:00Z`);

    if (dateTime.isValid()) {
      this.property.setValue(dateTime);
    }
  };

  protected render() {
    const name: string = this.name || this.property.name;
    const inputValue: string = this.property.value.format("YYYY-MM-DDTHH:mm");

    return html`
      <label class="ff-label ff-off">${name}</label>
      <input ?disabled=${this.ariaDisabled === "true"} type="datetime-local" class="sv-property-field ff-input" .value=${inputValue} 
        @change=${this.onChange} @focus=${(e) => { e.target.select(); }} @keypress=${(e) => { if (e.key === "Enter") { e.target.blur(); } }} />
      `;
  }
}
