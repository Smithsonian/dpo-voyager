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

import CVNavigation, { EViewPreset } from "../../core/components/CVNavigation";

import "../ui/PropertyOptions";
import "../ui/PropertyEvent";

import CVDocument from "./CVDocument";
import CVTool, { types, customElement, html, ToolView } from "./CVTool";

////////////////////////////////////////////////////////////////////////////////

export default class CVViewTool extends CVTool
{
    static readonly typeName: string = "CVViewTool";

    static readonly text = "View";
    static readonly icon = "eye";

    protected static readonly outs = {
        navigation: types.Object("Document.Navigation", CVNavigation),
    };

    outs = this.addOutputs<CVTool, typeof CVViewTool.outs>(CVViewTool.outs);

    createView()
    {
        return new ViewToolView(this);
    }

    protected onActiveDocument(previous: CVDocument, next: CVDocument)
    {
        super.onActiveDocument(previous, next);
        this.outs.navigation.setValue(next ? next.getInnerComponent(CVNavigation) : null);
    }
}

////////////////////////////////////////////////////////////////////////////////

@customElement("sv-view-tool-view")
export class ViewToolView extends ToolView<CVViewTool>
{
    protected navigation: CVNavigation = null;

    protected firstConnected()
    {
        super.firstConnected();
        this.classList.add("sv-view-tool-view");
    }

    protected connected()
    {
        super.connected();
        this.tool.outs.navigation.on("value", this.onNavigation, this);
        this.onNavigation(this.tool.outs.navigation.value);
    }

    protected disconnected()
    {
        this.onNavigation(null);
        this.tool.outs.navigation.off("value", this.onNavigation, this);
        super.disconnected();
    }

    protected render()
    {
        const navigation = this.navigation;

        if (!navigation) {
            return html``;
        }

        const zoom = navigation.ins.zoomExtents;
        const projection = navigation.ins.projection;
        const preset = navigation.ins.preset;
        const presetMap = [ EViewPreset.Front, EViewPreset.Back,
            EViewPreset.Left, EViewPreset.Right,
            EViewPreset.Top, EViewPreset.Bottom ];

        return html`<sv-property-options .property=${projection}></sv-property-options>
            <sv-property-options .property=${preset} name="View" .indexMap=${presetMap}></sv-property-options>
            <sv-property-event .property=${zoom} name="Center" icon="zoom"></sv-property-event>`;
    }

    protected onNavigation(navigation: CVNavigation)
    {
        if (this.navigation) {
            this.navigation.off("update", this.performUpdate, this);
        }
        if (navigation) {
            navigation.on("update", this.performUpdate, this);
        }

        this.navigation = navigation;
    }
}