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

import CVInterface from "../components/CVInterface";
import CVToolManager from "../components/CVToolManager";

import "../../core/ui/Logo";
import "./MainMenu";
import "./ToolBar";

import DocumentView, { customElement, html } from "@ff/scene/ui/DocumentView";
import CVMeta from "../components/CVMeta";

////////////////////////////////////////////////////////////////////////////////

@customElement("sv-chrome-view")
export default class ChromeView extends DocumentView
{
    protected get interface() {
        return this.system.getMainComponent(CVInterface);
    }
    protected get toolManager() {
        return this.system.getMainComponent(CVToolManager);
    }

    protected firstConnected()
    {
        this.style.pointerEvents = "none";
        this.setAttribute("pointer-events", "none");

        this.classList.add("sv-chrome-view");
    }

    protected connected()
    {
        this.interface.on("update", this.performUpdate, this);
        this.toolManager.ins.visible.on("value", this.performUpdate, this);
    }

    protected disconnected()
    {
        this.interface.off("update", this.performUpdate, this);
        this.toolManager.ins.visible.off("value", this.performUpdate, this);
    }

    protected render()
    {
        const system = this.system;

        const interfaceVisible = this.interface.ins.visible.value;
        const logoVisible = this.interface.ins.logo.value;
        const toolsVisible = this.toolManager.ins.visible.value;

        if (!interfaceVisible) {
            return html``;
        }

        // TODO: quick hack to retrieve a document title
        const document = this.documentManager.activeDocument;
        const metas = document ? document.getInnerComponents(CVMeta) : [];
        let title = "";
        for (let i = 0, n = metas.length; i < n; ++i) {
            title = metas[i].outs.title.value;
            if (title) {
                break;
            }
        }

        return html`
            <div class="sv-chrome-header">
                <sv-main-menu .system=${system}></sv-main-menu>
                <div class="sv-top-bar">
                    <div class="sv-main-title">${title || ""}<span>&nbsp; &nbsp;</span></div>
                    ${logoVisible ? html`<sv-logo></sv-logo>` : null}
                </div>
            </div>
            <div class="ff-flex-spacer"></div>
            ${toolsVisible ? html`<div class="sv-tool-bar-container"><sv-tool-bar .system=${this.system} @close=${this.onToggleTools}></sv-tool-bar></div>` : null}`;
    }

    protected onToggleTools()
    {
        const prop = this.toolManager.ins.visible;
        prop.setValue(!prop.value);
    }
}