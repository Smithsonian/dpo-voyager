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

import CDocumentManager from "@ff/graph/components/CDocumentManager";

import CVScene from "../../core/components/CVScene";
import "../ui/PropertyOptions";

import CVTool, { ToolView, customElement, html } from "./CVTool";

////////////////////////////////////////////////////////////////////////////////

export default class CVRenderTool extends CVTool
{
    static readonly typeName: string = "CVRenderTool";

    static readonly text = "Render Options";
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
    protected get activeDocument() {
        return this.tool.system.getMainComponent(CDocumentManager).activeDocument;
    }
    protected get activeScene() {
        const document = this.activeDocument;
        return document ? document.getInnerComponent(CVScene) : null;
    }

    protected firstConnected()
    {
        super.firstConnected();
        this.classList.add("sv-render-tool-view");
    }

    protected connected()
    {
        super.connected();
        this.activeScene.ins.shader.on("value", this.performUpdate, this);
    }

    protected disconnected()
    {
        this.activeScene.ins.shader.off("value", this.performUpdate, this);
        super.disconnected();
    }

    protected render()
    {
        const scene = this.activeScene;
        if (!scene) {
            return html``;
        }

        const shader = scene.ins.shader;

        return html`<sv-property-options .property=${shader}></sv-property-options>`;
    }
}