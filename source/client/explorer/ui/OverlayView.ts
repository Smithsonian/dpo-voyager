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

import "@ff/ui/ButtonGroup";
import "@ff/ui/PopupButton";
import CustomElement, { customElement, html, render } from "@ff/ui/CustomElement";

import ViewMenu from "./overlay/ViewMenu";
import RenderMenu from "./overlay/RenderMenu";

import SystemController from "../../core/components/SystemController";

////////////////////////////////////////////////////////////////////////////////

@customElement("sv-overlay-view")
export default class OverlayView extends CustomElement
{
    readonly controller: SystemController;

    constructor(controller: SystemController)
    {
        super();
        this.controller = controller;
    }

    firstConnected()
    {
        this.style.pointerEvents = "none";
        this.setAttribute("pointer-events", "none");

        const controller = this.controller;
        const viewMenu = new ViewMenu(controller, this);
        const renderMenu = new RenderMenu(controller, this);

        const template = html`
            <div class="sv-main-menu">
                <ff-button-group mode="exclusive">
                    <ff-popup-button icon="fa fas fa-eye">
                        ${viewMenu}
                    </ff-popup-button>
                    <ff-popup-button icon="fa fas fa-palette">
                        ${renderMenu}
                    </ff-popup-button>
                </ff-button-group>
                <ff-popup-button icon="fa fas fa-comment" selectable>
                </ff-popup-button>
                <ff-popup-button icon="fa fas fa-file-alt" selectable>
                </ff-popup-button>
            </div>
            <div class="sv-logo"></div>
        `;

        render(template, this);
    }
}