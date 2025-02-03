/**
 * 3D Foundation Project
 * Copyright 2024 Smithsonian Institution
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
import CustomElement, { property, PropertyValues, html } from "@ff/ui/CustomElement";

import "@ff/ui/Button";
import { IButtonClickEvent } from "@ff/ui/Button";
import CVLanguageManager from "client/components/CVLanguageManager";

////////////////////////////////////////////////////////////////////////////////

export default class PropertyBase extends CustomElement
{
    /** Expected property type */
    protected type :string;
    @property({ attribute: false })
    property: Property = null;

    @property({ type: String })
    name = "";

    @property({ attribute: false })
    text: string | string[] = null;

    @property({ attribute: false })
    language: CVLanguageManager = null;

    @property({ attribute: "aria-disabled"})
    ariaDisabled:"true"|"false"|null;

    protected firstConnected()
    {
        this.classList.add("sv-property");
    }

    protected update(changedProperties: PropertyValues): void
    {
        if (changedProperties.has("property")) {
            if (!this.property) {
                throw new Error("missing property attribute");
            }
            if (this.type && this.property.type !== this.type) {
                throw new Error(`not a ${this.type} property`);
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
}