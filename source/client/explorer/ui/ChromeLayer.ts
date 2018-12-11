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

import System from "@ff/core/ecs/System";

import "@ff/ui/ButtonGroup";
import "@ff/ui/PopupButton";
import CustomElement, { customElement, html, render } from "@ff/ui/CustomElement";

import ViewMenu from "./overlay/ViewMenu";
import RenderMenu from "./overlay/RenderMenu";

import SystemController from "../../core/components/SystemController";

////////////////////////////////////////////////////////////////////////////////

@customElement("sv-chrome-view")
export default class ChromeView extends CustomElement
{
    readonly controller: SystemController;

    constructor(system: System)
    {
        super();

        this.controller = system.getComponent(SystemController);
        if (!this.controller) {
            throw new Error("failed to get SystemController component");
        }
    }

    firstConnected()
    {
        this.style.pointerEvents = "none";
        this.setAttribute("pointer-events", "none");


        const viewMenu = new ViewMenu();
        viewMenu.controller = this.controller;
        viewMenu.portal = this;

        const renderMenu = new RenderMenu();
        renderMenu.controller = this.controller;
        renderMenu.portal = this;

        const template = html`
            <div class="sv-main-menu">
                <ff-button-group mode="exclusive">
                    <ff-popup-button class="ff-menu-button" icon="fa fas fa-eye" .content=${viewMenu}>
                    </ff-popup-button>
                    <ff-popup-button class="ff-menu-button" icon="fa fas fa-palette" .content=${renderMenu}>
                    </ff-popup-button>
                </ff-button-group>
                <ff-button class="ff-menu-button" icon="fa fas fa-comment" selectable>
                </ff-button>
                <ff-button class="ff-menu-button" icon="fa fas fa-file-alt" selectable>
                </ff-button>
            </div>
            <div class="sv-logo">
                <img src="images/si-dpo3d-logo-neg.svg" alt="Smithsonian DPO 3D Logo">
            </div>
        `;

        render(template, this);
    }
}