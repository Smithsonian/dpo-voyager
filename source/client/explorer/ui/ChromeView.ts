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

import InterfaceController, { IInterfaceUpdateEvent } from "../controllers/InterfaceController";
import ExplorerSystem from "../ExplorerSystem";

import ViewMenu from "./ViewMenu";
import RenderMenu from "./RenderMenu";

import CustomElement, { customElement, html, property } from "@ff/ui/CustomElement";

////////////////////////////////////////////////////////////////////////////////

@customElement("sv-chrome-view")
export default class ChromeView extends CustomElement
{
    @property({ attribute: false })
    system: ExplorerSystem;

    constructor(system?: ExplorerSystem)
    {
        super();
        this.system = system;
    }

    protected firstConnected()
    {
        this.style.pointerEvents = "none";
        this.setAttribute("pointer-events", "none");
    }

    protected connected()
    {
        this.system.interfaceController.on<IInterfaceUpdateEvent>("update", this.onInterfaceUpdate, this);
    }

    protected disconnected()
    {
        this.system.interfaceController.off<IInterfaceUpdateEvent>("update", this.onInterfaceUpdate, this);
    }

    protected render()
    {
        const isVisible = this.system.interfaceController.visible;
        const showLogo = this.system.interfaceController.logo;

        if (!isVisible) {
            return html``;
        }

        const viewMenu = new ViewMenu(this.system);
        viewMenu.portal = this;

        const renderMenu = new RenderMenu(this.system);
        renderMenu.portal = this;

        return html`
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
            ${showLogo ? html`
                <div class="sv-logo">
                    <img src="images/si-dpo3d-logo-neg.svg" alt="Smithsonian DPO 3D Logo">
                </div>
            ` : null}
        `;
    }

    protected onInterfaceUpdate()
    {
        this.requestUpdate();
    }
}