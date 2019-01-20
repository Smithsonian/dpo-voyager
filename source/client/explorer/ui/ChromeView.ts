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

import System from "@ff/graph/System";
import "@ff/ui/ButtonGroup";
import "@ff/ui/PopupButton";

import CExplorer from "../components/CExplorer";

import ViewMenu from "./ViewMenu";
import RenderMenu from "./RenderMenu";

import CustomElement, { customElement, html, property } from "@ff/ui/CustomElement";

////////////////////////////////////////////////////////////////////////////////

@customElement("sv-chrome-view")
export default class ChromeView extends CustomElement
{
    @property({ attribute: false })
    system: System;

    protected explorer: CExplorer;

    constructor(system?: System)
    {
        super();
        this.system = system;
        this.explorer = system.components.safeGet(CExplorer);
    }

    protected firstConnected()
    {
        this.style.pointerEvents = "none";
        this.setAttribute("pointer-events", "none");
    }

    protected connected()
    {
        const { visible, logo } = this.explorer.ins;
        visible.on("value", this.onInterfaceUpdate, this);
        logo.on("value", this.onInterfaceUpdate, this);
    }

    protected disconnected()
    {
        const { visible, logo } = this.explorer.ins;
        visible.off("value", this.onInterfaceUpdate, this);
        logo.off("value", this.onInterfaceUpdate, this);
    }

    protected render()
    {
        const { visible, logo } = this.explorer.ins;
        const isVisible = visible.value;
        const showLogo = logo.value;

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
                    <ff-popup-button class="ff-menu-button" icon="eye" .content=${viewMenu}>
                    </ff-popup-button>
                    <ff-popup-button class="ff-menu-button" icon="palette" .content=${renderMenu}>
                    </ff-popup-button>
                </ff-button-group>
                <ff-button class="ff-menu-button" icon="comment" selectable>
                </ff-button>
                <ff-button class="ff-menu-button" icon="document" selectable>
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