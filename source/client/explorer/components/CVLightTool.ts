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

import CLight from "@ff/scene/components/CLight";

import CVDocument from "./CVDocument";

import CVTool, { types, customElement, html, ToolView } from "./CVTool";

////////////////////////////////////////////////////////////////////////////////

export default class CVLightTool extends CVTool
{
    static readonly typeName: string = "CVLightTool";

    static readonly text = "Lights";
    static readonly icon = "bulb";

    createView()
    {
        return new LightToolView(this);
    }
}

////////////////////////////////////////////////////////////////////////////////

@customElement("sv-light-tool-view")
export class LightToolView extends ToolView<CVLightTool>
{
    protected lights: CLight[] = null;

    protected firstConnected()
    {
        super.firstConnected();
        this.classList.add("sv-light-tool-view");
    }

    protected render()
    {
        const lights = this.lights;
        if (!lights) {
            return html``;
        }

        return html`<div>Light Tool (coming soon)</div>`;
    }

    protected onActiveDocument(previous: CVDocument, next: CVDocument)
    {
        this.lights = next ? next.getInnerComponents(CLight) : null;

        this.requestUpdate();
    }
}