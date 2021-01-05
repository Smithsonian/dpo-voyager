/**
 * 3D Foundation Project
 * Copyright 2019 Smithsonian Institution
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

import SystemView, { customElement, html } from "@ff/scene/ui/SystemView";

import CVToolProvider, { IActiveToolEvent } from "../../components/CVToolProvider";
import CVTool from "../../components/CVTool";
import CVLanguageManager from "client/components/CVLanguageManager";

////////////////////////////////////////////////////////////////////////////////

export interface IToolBarCloseEvent extends CustomEvent
{
    type: "close",
}

@customElement("sv-tool-bar")
export default class ToolBar extends SystemView
{
    protected get toolProvider() {
        return this.system.getMainComponent(CVToolProvider);
    }
    protected get language() {
        return this.system.getComponent(CVLanguageManager);
    }

    protected firstConnected()
    {
        super.firstConnected();
        this.classList.add("sv-bottom-bar-container", "sv-transition", "sv-tool-bar");
        setTimeout(() => this.classList.remove("sv-transition"), 1);
    }

    protected connected()
    {
        super.connected();
        this.toolProvider.on<IActiveToolEvent>("active-component", this.onUpdate, this);
        this.language.outs.language.on("value", this.onUpdate, this);
    }

    protected disconnected()
    {
        this.language.outs.language.off("value", this.onUpdate, this);
        this.toolProvider.off<IActiveToolEvent>("active-component", this.onUpdate, this);
        super.disconnected();
    }

    protected render()
    {
        const tools = this.toolProvider.scopedComponents;
        const activeTool = this.toolProvider.activeComponent;
        const language = this.language;

        const toolButtons = tools.map(tool =>
            html`<ff-button class="sv-tool-button" transparent text=${language.getLocalizedString(tool.text)} icon=${tool.icon}
                ?selected=${tool === activeTool} @click=${e => this.onSelectTool(tool)}></ff-button>`);

        return html`<div class="sv-blue-bar">${activeTool ? activeTool.createView() : null}
            <div class="sv-section">
                <ff-button class="sv-section-lead" transparent icon="close" title=${language.getLocalizedString("Close Tools")} @click=${this.onClose}></ff-button>
                <div class="sv-tool-buttons">${toolButtons}</div>
                <sv-tool-menu-view .system=${this.system}></sv-tool-menu-view>
            </div></div>`;
    }

    protected onSelectTool(tool: CVTool)
    {
        this.toolProvider.activeComponent = tool;
    }

    protected onClose(event: MouseEvent)
    {
        this.dispatchEvent(new CustomEvent("close"));
        event.stopPropagation();
    }
}
