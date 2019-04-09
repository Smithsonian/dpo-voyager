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

import CVDocument from "./CVDocument";

import CVTool, { types, customElement, html, ToolView } from "./CVTool";
import { EBackgroundStyle } from "@ff/scene/components/CBackground";

////////////////////////////////////////////////////////////////////////////////

export default class CVEnvironmentTool extends CVTool
{
    static readonly typeName: string = "CVEnvironmentTool";

    static readonly text = "Environment";
    static readonly icon = "environment";

    createView()
    {
        return new EnvironmentToolView(this);
    }
}

////////////////////////////////////////////////////////////////////////////////

@customElement("sv-environment-tool-view")
export class EnvironmentToolView extends ToolView<CVEnvironmentTool>
{
    protected firstConnected()
    {
        super.firstConnected();
        this.classList.add("sv-group", "sv-environment-tool-view");
    }

    protected render()
    {
        const tool = this.tool;

        if (!this.activeDocument) {
            return html`No active document`;
        }

        const setup = this.activeDocument.setup;
        const grid = setup.grid;
        const floor = setup.floor;
        const background = setup.background;
        const options = [ "Solid", "Linear", "Radial" ];
        const style = background.ins.style.getValidatedValue();

        const isSolid = style === EBackgroundStyle.Solid;
        const isLinear = style === EBackgroundStyle.LinearGradient;

        //let name0 = isSolid ? " " : (isLinear ? "Top" : "Inner");
        //let name1 = isSolid ? "" : (isLinear ? "Btm" : "Outer");

        return html`<div class="sv-section"><ff-button class="sv-section-lead" transparent icon=${tool.icon}></ff-button>
            <div class="sv-tool-controls">
                <sv-property-options .property=${background.ins.style} .options=${options} name="Background"></sv-property-options>
                <sv-property-color class="sv-nogap" .property=${background.ins.color0} name=" "></sv-property-color>
                ${!isSolid ? html`<sv-property-color class="sv-nogap" .property=${background.ins.color1} name=" "></sv-property-color>` : null}
                <sv-property-boolean .property=${grid.ins.visible} name="Grid"></sv-property-boolean>
                <sv-property-color class="sv-nogap" .property=${grid.ins.color} name=" "></sv-property-color>
                <sv-property-boolean .property=${floor.ins.visible} name="Floor"></sv-property-boolean>
            </div>
        </div>`;
    }

    protected onActiveDocument(previous: CVDocument, next: CVDocument)
    {
        if (previous) {
            const background = previous.setup.background;
            background.ins.style.off("value", this.onUpdate, this);
        }
        if (next) {
            const background = next.setup.background;
            background.ins.style.on("value", this.onUpdate, this);
        }

        this.requestUpdate();
    }
}