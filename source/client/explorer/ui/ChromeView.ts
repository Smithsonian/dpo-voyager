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

import CVToolProvider from "../components/CVToolProvider";

import "../../core/ui/Logo";
import "./MainMenu";
//import "./TourMenu";
import "./TourNavigator";
import "./ToolBar";

import DocumentView, { customElement, html } from "./DocumentView";
import CVScene from "../components/CVScene";

////////////////////////////////////////////////////////////////////////////////

@customElement("sv-chrome-view")
export default class ChromeView extends DocumentView
{
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
        if (!this.activeDocument) {
            return html``;
        }

        const system = this.system;
        const scene = this.activeScene;

        const interfaceVisible = scene ? scene.interface.ins.visible.value : true;
        const logoVisible = scene ? scene.interface.ins.logo.value : true;

        const readerVisible = scene ? scene.reader.ins.visible.value : false;
        const toolsVisible = !readerVisible && this.toolProvider.ins.visible.value;

        if (!interfaceVisible) {
            return html``;
        }

        // TODO: quick hack to retrieve a document title
        const title = (scene ? scene.node.name : "") || "Untitled";

        // <div class="sv-main-title">${title || ""}<span>&nbsp; &nbsp;</span></div>

        return html`
            <div class="sv-chrome-header">
                <sv-main-menu .system=${system}></sv-main-menu>
                <div class="sv-top-bar">
                    <sv-tour-nagivator .system=${system}>Tours</sv-tour-nagivator>
                    ${logoVisible ? html`<sv-logo></sv-logo>` : null}
                </div>
            </div>
            <div class="ff-flex-spacer"></div>
            ${toolsVisible ? html`<div class="sv-tool-bar-container"><sv-tool-bar .system=${this.system} @close=${this.closeTools}></sv-tool-bar></div>` : null}`;
    }

    protected closeTools()
    {
        this.toolProvider.ins.visible.setValue(false);
    }

    protected onActiveScene(previous: CVScene, next: CVScene)
    {
        if (previous) {
            previous.interface.off("update", this.onUpdate, this);
            previous.reader.ins.visible.off("value", this.onUpdate, this);
        }
        if (next) {
            next.interface.on("update", this.onUpdate, this);
            next.reader.ins.visible.on("value", this.onUpdate, this);
        }
    }
}