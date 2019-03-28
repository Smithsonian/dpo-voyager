/**
 * 3D Foundation Project
 * Copyright 2018 Smithsonian Institution
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
import CustomElement, { customElement, property, html } from "@ff/ui/CustomElement";

import "@ff/ui/Button";
import { IButtonClickEvent } from "@ff/ui/Button";

////////////////////////////////////////////////////////////////////////////////

@customElement("sv-property-event")
export default class PropertyEvent extends CustomElement
{
    @property({ attribute: false })
    property: Property = null;

    @property({ type: String })
    name = "";

    @property({ type: String })
    text = "";

    @property({ type: String })
    icon = "";

    protected firstConnected()
    {
        this.classList.add("sv-property-view", "sv-property-event");
    }

    protected connected()
    {
        this.property.on("value", this.performUpdate, this);
    }

    protected disconnected()
    {
        this.property.off("value", this.performUpdate, this);
    }

    protected render()
    {
        const property = this.property;
        const name = this.name || property.name;
        const text = this.text;
        const icon = this.icon;

        return html`<label class="ff-label ff-off">${name}</label>
            <div class="sv-options">
                <ff-button .text=${text} .icon=${icon} @click=${this.onButtonClick}></ff-button>
            </div>`;
    }

    protected onButtonClick(event: IButtonClickEvent)
    {
        this.property.set();
    }
}