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

import CVDocument_old from "./CVDocument_old";
import CVTool, { types, customElement, html, ToolView } from "./CVTool";

////////////////////////////////////////////////////////////////////////////////

export default class CVLightTool extends CVTool
{
    static readonly typeName: string = "CVLightTool";

    static readonly text = "Lights";
    static readonly icon = "bulb";

    protected static readonly outs = {
        scene: types.Object("Document.Scene", CVScene_old),
    };

    outs = this.addOutputs<CVTool, typeof CVLightTool.outs>(CVLightTool.outs);

    createView()
    {
        return new LightToolView(this);
    }

    protected onActiveDocument(previous: CVDocument_old, next: CVDocument_old)
    {
        super.onActiveDocument(previous, next);
        this.outs.scene.setValue(next ? next.getInnerComponent(CVScene_old) : null);
    }
}

////////////////////////////////////////////////////////////////////////////////

@customElement("sv-light-tool-view")
export class LightToolView extends ToolView<CVLightTool>
{
    protected scene: CVScene_old = null;

    protected firstConnected()
    {
        super.firstConnected();
        this.classList.add("sv-light-tool-view");
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

        return html`<div>Light Tool (coming soon)</div>`;
    }

    protected onScene(scene: CVScene_old)
    {
        if (this.scene) {

        }
        if (scene) {

        }

        this.scene = scene;
    }
}