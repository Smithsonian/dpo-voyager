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

import CVScene_old from "../../core/components/CVScene_old";

import "../ui/PropertyOptions";

import CVDocument_old from "./CVDocument_old";
import CVTool, { types, customElement, html, ToolView } from "./CVTool";

////////////////////////////////////////////////////////////////////////////////

export default class CVRenderTool extends CVTool
{
    static readonly typeName: string = "CVRenderTool";

    static readonly text = "Material";
    static readonly icon = "palette";

    protected static readonly outs = {
        scene: types.Object("Document.Scene", CVScene_old),
    };

    outs = this.addOutputs<CVTool, typeof CVRenderTool.outs>(CVRenderTool.outs);

    createView()
    {
        return new RenderToolView(this);
    }

    protected onActiveDocument(previous: CVDocument_old, next: CVDocument_old)
    {
        super.onActiveDocument(previous, next);
        this.outs.scene.setValue(next ? next.getInnerComponent(CVScene_old) : null);
    }
}

////////////////////////////////////////////////////////////////////////////////

@customElement("sv-render-tool-view")
export class RenderToolView extends ToolView<CVRenderTool>
{
    protected scene: CVScene_old = null;

    protected firstConnected()
    {
        super.firstConnected();
        this.classList.add("sv-render-tool-view");
    }

    protected connected()
    {
        super.connected();
        const sceneProp = this.tool.outs.scene;
        sceneProp.on("value", this.onScene, this);
        this.onScene(sceneProp.value);
    }

    protected disconnected()
    {
        this.onScene(null);
        this.tool.outs.scene.off("value", this.onScene, this);
        super.disconnected();
    }

    protected render()
    {
        const scene = this.scene;
        if (!scene) {
            return html``;
        }

        const shader = scene.ins.shader;

        return html`<sv-property-options .property=${shader} name="Material"></sv-property-options>`;
    }

    protected onScene(scene: CVScene_old)
    {
        if (this.scene) {
            this.scene.ins.shader.off("value", this.performUpdate, this);
        }
        if (scene) {
            scene.ins.shader.on("value", this.performUpdate, this);
        }

        this.scene = scene;
    }
}