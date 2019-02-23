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
import CDocumentManager, { IActiveDocumentEvent } from "@ff/graph/components/CDocumentManager";

import "@ff/ui/ButtonGroup";
import "@ff/ui/PopupButton";

import CVScene from "../../core/components/CVScene";
import CVInterface from "../components/CVInterface";
import CVReader from "../components/CVReader";

import ViewMenu from "./ViewMenu";
import RenderMenu from "./RenderMenu";

import CustomElement, { customElement, html, property } from "@ff/ui/CustomElement";
import CVDocument from "../components/CVDocument";

////////////////////////////////////////////////////////////////////////////////

@customElement("sv-chrome-view")
export default class ChromeView extends CustomElement
{
    @property({ attribute: false })
    system: System;

    private _viewMenu: ViewMenu = null;
    private _renderMenu: RenderMenu = null;

    constructor(system?: System)
    {
        super();
        this.system = system;
    }

    protected get documentManager() {
        return this.system.getMainComponent(CDocumentManager);
    }
    protected get interface() {
        return this.system.getMainComponent(CVInterface);
    }
    protected get reader() {
        return this.system.getMainComponent(CVReader);
    }

    protected firstConnected()
    {
        this.style.pointerEvents = "none";
        this.setAttribute("pointer-events", "none");

        this.classList.add("sv-chrome-view");

        this._viewMenu = new ViewMenu(this.system);
        this._viewMenu.portal = this;

        this._renderMenu = new RenderMenu(this.system);
        this._renderMenu.portal = this;
    }

    protected connected()
    {
        const documentManager = this.documentManager;
        documentManager.on<IActiveDocumentEvent>("active-document", this.onActiveDocument, this);

        const document = documentManager.activeDocument as CVDocument;
        if (document) {
            document.scene.ins.annotations.on("value", this.performUpdate, this);
        }
        const iface = this.interface;
        iface.ins.visible.on("value", this.performUpdate, this);
        iface.ins.logo.on("value", this.performUpdate, this);
        iface.outs.fullscreenEnabled.on("value", this.performUpdate, this);

        this.reader.ins.visible.on("value", this.performUpdate, this);
    }

    protected disconnected()
    {
        const documentManager = this.documentManager;
        documentManager.off<IActiveDocumentEvent>("active-document", this.onActiveDocument, this);

        const document = documentManager.activeDocument as CVDocument;
        if (document) {
            document.scene.ins.annotations.off("value", this.performUpdate, this);
        }

        const iface = this.interface;
        iface.ins.visible.off("value", this.performUpdate, this);
        iface.ins.logo.off("value", this.performUpdate, this);
        iface.outs.fullscreenEnabled.off("value", this.performUpdate, this);

        this.reader.ins.visible.off("value", this.performUpdate, this);
    }

    protected render()
    {
        const iface = this.interface;
        const interfaceVisible = iface.ins.visible.value;
        const logoVisible = iface.ins.logo.value;
        const fullscreenEnabled = iface.outs.fullscreenEnabled.value;
        const fullscreenAvailable = iface.outs.fullscreenAvailable.value;
        const readerVisible = this.reader.ins.visible.value;

        const document = this.documentManager.activeDocument as CVDocument;
        const annotationsVisible = document
            ? document.scene.ins.annotations.value : false;

        if (!interfaceVisible) {
            return html``;
        }

        return html`
            <div class="sv-main-menu">
                <ff-button-group mode="exclusive">
                    <ff-popup-button class="ff-menu-button" icon="eye" .content=${this._viewMenu}>
                    </ff-popup-button>
                    <ff-popup-button class="ff-menu-button" icon="palette" .content=${this._renderMenu}>
                    </ff-popup-button>
                </ff-button-group>
                <ff-button class="ff-menu-button" icon="comment" title="show/hide annotations"
                    ?selected=${annotationsVisible} @click=${this.onClickAnnotations}>
                </ff-button>
                <ff-button class="ff-menu-button" icon="document" title="show/hide document reader"
                    ?selected=${readerVisible} @click=${this.onClickReader}>
                </ff-button>
                ${fullscreenAvailable ? html`<ff-button class="ff-menu-button" icon="expand" title="enable/disable fullscreen mode"
                    ?selected=${fullscreenEnabled} @click=${this.onClickFullscreen}></ff-button>` : null}
            </div>
            ${logoVisible ? html`<div class="sv-logo">
                <img src="images/si-dpo3d-logo-neg.svg" alt="Smithsonian DPO 3D Logo">
            </div>` : null}
        `;
    }

    protected onClickAnnotations()
    {
        const document = this.documentManager.activeDocument as CVDocument;

        if (document) {
            const prop = document.scene.ins.annotations;
            prop.setValue(!prop.value);
        }
    }

    protected onClickReader()
    {
        const prop = this.reader.ins.visible;
        prop.setValue(!prop.value);
    }

    protected onClickFullscreen()
    {
        this.interface.toggleFullscreen();
    }

    protected onActiveDocument(event: IActiveDocumentEvent)
    {
        const previous = event.previous as CVDocument;
        const next = event.next as CVDocument;

        if (previous) {
            previous.scene.ins.annotations.off("value", this.performUpdate, this);
        }
        if (next) {
            next.scene.ins.annotations.on("value", this.performUpdate, this);
        }

        this.performUpdate();
    }
}