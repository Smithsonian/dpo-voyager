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

import "../ui/PropertyOptions";

import CVDocument from "./CVDocument";
import CVViewer from "./CVViewer";

import CVTool, { types, customElement, html, ToolView } from "./CVTool";

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
        this.classList.add("sv-render-tool-view");
    }

    protected render()
    {

        const viewer = this.viewer;
        if (!viewer) {
            return html``;
        }

        const shader = viewer.ins.shader;

        return html`<sv-property-options .property=${shader} name="Material"></sv-property-options>`;
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
}