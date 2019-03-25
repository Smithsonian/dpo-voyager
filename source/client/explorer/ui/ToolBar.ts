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

import CVToolProvider from "../components/CVToolProvider";
import CVTool, { ToolView } from "../components/CVTool";

////////////////////////////////////////////////////////////////////////////////

export interface IToolBarCloseEvent extends CustomEvent
{
    type: "close",
}

@customElement("sv-tool-bar")
export default class ToolBar extends SystemElement
{
    protected get toolProvider() {
        return this.system.getMainComponent(CVToolProvider);
    }

    protected firstConnected()
    {
        this.classList.add("sv-tool-bar", "sv-transition");
        setTimeout(() => this.classList.remove("sv-transition"), 1);
    }

    protected connected()
    {
        super.connected();
        this.toolProvider.on<IActiveToolEvent>.outs.activeTool.on("value", this.performUpdate, this);
    }

    protected disconnected()
    {
        this.toolManager.outs.activeTool.off("value", this.performUpdate, this);
        super.disconnected();
    }

    protected render()
    {
        const tools = this.toolManager.tools;
        const activeTool = this.toolManager.activeTool;

        const toolButtons = tools.map((tool, index) =>
            html`<ff-button class="sv-tool-button" transparent text=${tool.text} icon=${tool.icon}
                ?selected=${tool === activeTool} @click=${e => this.onSelectTool(index)}></ff-button>`);

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

    protected onSelectTool(index: number)
    {
        this.toolManager.ins.activeTool.setValue(index + 1);
    }

    protected onClose(event: MouseEvent)
    {
        this.dispatchEvent(new CustomEvent("close"));
        event.stopPropagation();
    }
}
