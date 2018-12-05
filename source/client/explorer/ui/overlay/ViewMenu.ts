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

import "@ff/ui/Button";
import Popup from "@ff/ui/Popup";
import { customElement, html, property, PropertyValues } from "@ff/ui/LitElement";

import SystemController from "../../../core/components/SystemController";

////////////////////////////////////////////////////////////////////////////////

@customElement("sv-view-menu")
export default class ViewMenu extends Popup
{
    readonly controller: SystemController;


    constructor(controller: SystemController, portal: HTMLElement)
    {
        super();

        this.controller = controller;
        this.portal = portal;
        this.closable = true;
    }

    protected render()
    {
        const controller = this.controller;
        if (!controller) {
            throw new Error("controller not set");
        }

        return html`
            <div style="position:relative;">View Menu</div>
        `;
    }

    protected firstUpdated(changedProperties)
    {
        super.firstUpdated(changedProperties);

        this.setStyle({
            display: "flex",
            flexDirection: "column"
        });

        this.classList.add("sv-popup-menu");
    }
}