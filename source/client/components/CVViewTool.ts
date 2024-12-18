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

import "@ff/ui/Button";

import "../ui/properties/PropertyOptions";
import "../ui/properties/PropertyEvent";

import CVDocument from "./CVDocument";
import { EViewPreset } from "./CVOrbitNavigation";

import CVTool, { customElement, html, ToolView } from "./CVTool";

////////////////////////////////////////////////////////////////////////////////

export default class CVViewTool extends CVTool
{
    static readonly typeName: string = "CVViewTool";

    static readonly text = "View";
    static readonly icon = "eye";

    createView()
    {
        return new ViewToolView(this);
    }
}

////////////////////////////////////////////////////////////////////////////////

@customElement("sv-view-tool-view")
export class ViewToolView extends ToolView<CVViewTool>
{
    protected firstConnected()
    {
        super.firstConnected();
        this.classList.add("sv-view-tool-view");
    }

    protected render()
    {
        const document = this.activeDocument;

        if (!document) {
            return html``;
        }

        const tool = this.tool;
        const navigation = document.setup.navigation;
        const language = document.setup.language;

        const projection = navigation.ins.projection;
        const preset = navigation.ins.preset;
        const zoom = navigation.ins.zoomExtents;

        const presetMap = [ EViewPreset.Front, EViewPreset.Back,
            EViewPreset.Left, EViewPreset.Right,
            EViewPreset.Top, EViewPreset.Bottom ];

        return html`<div role="toolbar" aria-label="View tool" class="sv-section"><ff-button class="sv-section-lead" title=${language.getLocalizedString("Close Tool")} @click=${this.onClose} transparent icon="close"></ff-button>
            <div class="sv-tool-controls">
                <sv-property-options .property=${projection} .language=${language} name=${language.getLocalizedString("Projection")}></sv-property-options>
                <sv-property-options .property=${preset} .language=${language} name=${language.getLocalizedString("View")} .indexMap=${presetMap}></sv-property-options>
                <sv-property-event .property=${zoom} name=${language.getLocalizedString("Center")} icon="zoom"></sv-property-event>
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
        const focusElement = this.getElementsByTagName("sv-property-options")[0] as HTMLElement;
        focusElement.focus();
    }

    protected onClose(event: MouseEvent)
    {
        this.parentElement.dispatchEvent(new CustomEvent("close"));
        event.stopPropagation();
    }
}