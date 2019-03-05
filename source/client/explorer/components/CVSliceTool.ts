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

import { types } from "@ff/graph/Component";

import "../ui/PropertyBoolean";
import "../ui/PropertyOptions";
import "../ui/PropertySlider";

import CVTool, { ToolView, customElement, html } from "./CVTool";

////////////////////////////////////////////////////////////////////////////////

export default class CVSliceTool extends CVTool
{
    static readonly typeName: string = "CVSliceTool";

    static readonly text = "Slice Tool";
    static readonly icon = "knife";

    protected static readonly sliceIns = {
        enabled: types.Boolean("Slice.Enabled"),
        axis: types.Option("Slice.Axis", [ "X", "Y", "Z" ]),
        position: types.Number("Slice.Position", { min: -1, max: 1, preset: 0 }),
    };

    ins = this.addInputs(CVSliceTool.sliceIns);

    update()
    {
        return true;
    }

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
        this.classList.add("sv-slice-tool-view");
    }

    protected render()
    {
        const enabled = this.tool.ins.enabled;
        const axis = this.tool.ins.axis;
        const position = this.tool.ins.position;

        return html`<sv-property-boolean .property=${enabled} name="Slice Tool"></sv-property-boolean>
            <sv-property-options .property=${axis}></sv-property-options>
            <sv-property-slider .property=${position}></sv-property-slider>`;
    }
}