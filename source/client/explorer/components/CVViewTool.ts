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

import CVNavigation from "../../core/components/CVNavigation";

import "../ui/PropertyOptions";

import CVTool, { ToolView, customElement, html } from "./CVTool";

////////////////////////////////////////////////////////////////////////////////

export default class CVViewTool extends CVTool
{
    static readonly typeName: string = "CVViewTool";

    static readonly text = "View Options";
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
    protected get navigation() {
        return this.tool.system.getMainComponent(CVNavigation);
    }

    protected firstConnected()
    {
        super.firstConnected();
        this.classList.add("sv-view-tool-view");
    }

    protected connected()
    {
        super.connected();

        this.navigation.ins.projection.on("value", this.performUpdate, this);
        this.navigation.ins.preset.on("value", this.performUpdate, this);
    }

    protected disconnected()
    {
        this.navigation.ins.projection.off("value", this.performUpdate, this);
        this.navigation.ins.preset.off("value", this.performUpdate, this);

        super.disconnected();
    }

    protected render()
    {
        const projection = this.navigation.ins.projection;
        const preset = this.navigation.ins.preset;

        return html`<sv-property-options .property=${projection}></sv-property-options>
            <sv-property-options .property=${preset} name="View"></sv-property-options>`;
    }
}