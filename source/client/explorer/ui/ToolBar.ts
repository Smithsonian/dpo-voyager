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

import SystemElement, { customElement, html } from "../../core/ui/SystemElement";

import CVTools, { IActiveToolEvent } from "../components/CVTools";
import CVTool, { ToolView } from "../components/CVTool";

////////////////////////////////////////////////////////////////////////////////

export interface IToolBarCloseEvent extends CustomEvent
{
    type: "close",
}

@customElement("sv-tool-bar")
export default class ToolBar extends SystemElement
{
    protected get tools() {
        return this.system.getMainComponent(CVTools);
    }

    protected firstConnected()
    {
        this.classList.add("sv-tool-bar", "sv-transition");
        setTimeout(() => this.classList.remove("sv-transition"), 1);
    }

    protected connected()
    {
        this.tools.on<IActiveToolEvent>("active-tool", this.performUpdate, this);
    }

    protected disconnected()
    {
        this.tools.off<IActiveToolEvent>("active-tool", this.performUpdate, this);
    }

    protected render()
    {
        const tools = this.tools.tools;
        const activeTool = this.tools.activeTool;

        const toolButtons = tools.map(tool =>
            html`<ff-button class="sv-tool-button" transparent text=${tool.text} icon=${tool.icon}
                ?selected=${tool === activeTool} @click=${e => this.onSelectTool(tool)}></ff-button>`);

        const toolView = activeTool ? html`<div class="sv-section">
            <ff-button class="sv-section-button" transparent icon=${activeTool.icon}></ff-button>
            ${activeTool.createView()}</div>` : null;

        return html`${toolView}
            <div class="sv-section">
                <ff-button class="sv-section-button" transparent icon="close" @click=${this.onClose}></ff-button>
                <div class="sv-tool-buttons">${toolButtons}</div>
                <sv-tool-menu-view .system=${this.system}></sv-tool-menu-view>
            </div>`;
    }

    protected onSelectTool(tool: CVTool)
    {
        this.tools.activeTool = tool;
    }

    protected onClose(event: MouseEvent)
    {
        this.dispatchEvent(new CustomEvent("close"));
        event.stopPropagation();
    }
}
