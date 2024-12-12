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

import "../ui/properties/PropertyBoolean";
import "../ui/properties/PropertyOptions";
import "../ui/properties/PropertySlider";

import CVDocument from "./CVDocument";

import CVTool, { customElement, html, ToolView } from "./CVTool";

////////////////////////////////////////////////////////////////////////////////

export default class CVSliceTool extends CVTool
{
    static readonly typeName: string = "CVSliceTool";

    static readonly text = "Slice";
    static readonly icon = "knife";

    createView()
    {
        return new SliceToolView(this);
    }
}

////////////////////////////////////////////////////////////////////////////////

@customElement("sv-slice-tool-view")
export class SliceToolView extends ToolView<CVSliceTool>
{
    protected firstConnected()
    {
        super.firstConnected();
        this.classList.add("sv-group", "sv-slice-tool-view");
    }

    protected render()
    {
        const document = this.activeDocument;

        if (!document) {
            return html``;
        }

        const tool = this.tool;
        const slicer = document.setup.slicer;
        const enabled = slicer.ins.enabled;
        const axis = slicer.ins.axis;
        const position = slicer.ins.position;
        const language = document.setup.language;

        return html`<div class="sv-section"><ff-button class="sv-section-lead" title=${language.getLocalizedString("Close Tool")} @click=${this.onClose} transparent icon="close"></ff-button>
            <div class="sv-tool-controls">
                <sv-property-boolean .property=${enabled} .language=${language} name=${language.getLocalizedString("Slice Tool")}></sv-property-boolean>
                <sv-property-options .property=${axis} .language=${language} name=${language.getLocalizedString("Axis")}></sv-property-options>
                <sv-property-slider .property=${position} name=${language.getLocalizedString("Position")}></sv-property-slider>
            </div>
        </div>`;
    }

    protected onActiveDocument(previous: CVDocument, next: CVDocument)
    {
        this.requestUpdate();
    }

    protected async setFocus()
    {
        await this.updateComplete;
        const focusElement = this.getElementsByTagName("ff-button")[1] as HTMLElement;
        focusElement.focus();
    }

    protected onClose(event: MouseEvent)
    {
        this.parentElement.dispatchEvent(new CustomEvent("close"));
        event.stopPropagation();
    }
}