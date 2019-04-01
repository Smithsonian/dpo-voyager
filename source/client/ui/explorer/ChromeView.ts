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

import Subscriber from "@ff/core/Subscriber";

import "@ff/ui/ButtonGroup";
import "@ff/ui/PopupButton";

import CVToolProvider from "../../components/CVToolProvider";
import CVDocument from "../../components/CVDocument";

import "../Logo";
import "./MainMenu";
//import "./TourMenu";
import "./TourNavigator";
import "./ToolBar";

import DocumentView, { customElement, html } from "./DocumentView";

////////////////////////////////////////////////////////////////////////////////

@customElement("sv-chrome-view")
export default class ChromeView extends DocumentView
{
    protected documentProps = new Subscriber("value", this.onUpdate, this);

    protected get toolProvider() {
        return this.system.getMainComponent(CVToolProvider);
    }

    protected firstConnected()
    {
        this.style.pointerEvents = "none";
        this.setAttribute("pointer-events", "none");

        this.classList.add("sv-chrome-view");
    }

    protected connected()
    {
        super.connected();
        this.toolProvider.ins.visible.on("value", this.onUpdate, this);
    }

    protected disconnected()
    {
        this.toolProvider.ins.visible.off("value", this.onUpdate, this);
        super.disconnected();
    }

    protected render()
    {
        const document = this.activeDocument;

        if (!document) {
            return html``;
        }

        const setup = document.setup;

        const interfaceVisible = setup.interface.ins.visible.value;
        const logoVisible = setup.interface.ins.logo.value;

        const readerVisible = setup.reader.ins.visible.value;
        const toursVisible = setup.tours.ins.enabled.value;
        const toolsVisible = !readerVisible && this.toolProvider.ins.visible.value;

        if (!interfaceVisible) {
            return html``;
        }

        // TODO: quick hack to retrieve a document title
        const title = "A quite long and awesome model title";

        return html`
            <div class="sv-chrome-header">
                <sv-main-menu .system=${this.system}></sv-main-menu>
                <div class="sv-top-bar">
                    <div class="ff-ellipsis sv-main-title">${title}<span class="ff-ellipsis"> </span></div>
                    ${logoVisible ? html`<sv-logo></sv-logo>` : null}
                </div>
            </div>
            <div class="ff-flex-spacer"></div>
            ${toursVisible ? html`<sv-tour-navigator .system=${this.system}></sv-tour-navigator>` : null}
            ${toolsVisible ? html`<div class="sv-tool-bar-container"><sv-tool-bar .system=${this.system} @close=${this.closeTools}></sv-tool-bar></div>` : null}`;
    }

    protected closeTools()
    {
        this.toolProvider.ins.visible.setValue(false);
    }

    protected onActiveDocument(previous: CVDocument, next: CVDocument)
    {
        if (previous) {
            this.documentProps.off();
        }
        if (next) {
            const setup = next.setup;
            this.documentProps.on(
                setup.interface.ins.visible,
                setup.interface.ins.logo,
                setup.reader.ins.visible,
                setup.tours.ins.enabled
            );
        }

        this.requestUpdate();
    }
}