/**
 * 3D Foundation Project
 * Copyright 2024 Smithsonian Institution
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

import "../ui/properties/PropertyOptions";

import CVDocument from "./CVDocument";
import CVViewer from "./CVViewer";

import CVTool, { customElement, html, ToolView } from "./CVTool";

////////////////////////////////////////////////////////////////////////////////

export default class CVRenderTool extends CVTool
{
    static readonly typeName: string = "CVRenderTool";

    static readonly text = "Material";
    static readonly icon = "palette";

    createView()
    {
        return new RenderToolView(this);
    }
}

////////////////////////////////////////////////////////////////////////////////

@customElement("sv-render-tool-view")
export class RenderToolView extends ToolView<CVRenderTool>
{
    protected viewer: CVViewer = null;

    protected firstConnected()
    {
        super.firstConnected();
        this.classList.add("sv-group", "sv-render-tool-view");
    }

    protected render()
    {
        const tool = this.tool;
        const document = this.activeDocument;

        const viewer = this.viewer;
        if (!viewer) {
            return html``;
        }

        const shader = viewer.ins.shader;
        const language = document.setup.language;

        return html`<div class="sv-section"><ff-button class="sv-section-lead" title=${language.getLocalizedString("Close Tool")} @click=${this.onClose} transparent icon="close"></ff-button>
            <div class="sv-tool-controls">
                <sv-property-options .property=${shader} .language=${language} name=${language.getLocalizedString("Material")}></sv-property-options>
            </div>
        </div>`;
    }

    protected onActiveDocument(previous: CVDocument, next: CVDocument)
    {
        if (this.viewer) {
            this.viewer.ins.shader.off("value", this.onUpdate, this);
            this.viewer = null;
        }

        if (next) {
            this.viewer = next.setup.viewer;
            this.viewer.ins.shader.on("value", this.onUpdate, this);
        }
    }

    protected async setFocus()
    {
        await this.updateComplete;
        const focusElement = this.getElementsByTagName("sv-property-options")[0] as HTMLElement;
        focusElement.focus();
    }

    protected onClose(event: MouseEvent)
    {
        this.parentElement.dispatchEvent(new CustomEvent("close"));
        event.stopPropagation();
    }
}