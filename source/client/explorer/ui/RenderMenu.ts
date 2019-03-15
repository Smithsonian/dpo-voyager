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

import PropertyTracker from "@ff/graph/PropertyTracker";
import System from "@ff/graph/System";

import "@ff/ui/Button";
import { IButtonClickEvent } from "@ff/ui/Button";

import CVScene_old, { EShaderMode } from "../../core/components/CVScene_old";

import { customElement, html, property } from "@ff/ui/CustomElement";
import Popup from "@ff/ui/Popup";

////////////////////////////////////////////////////////////////////////////////

@customElement("sv-render-menu")
export default class RenderMenu extends Popup
{
    @property({ attribute: false })
    system: System;

    protected propShader: PropertyTracker<any>;

    constructor(system?: System)
    {
        super();
        this.system = system;
        this.propShader = new PropertyTracker(this.onPropertyChange, this);

        this.position = "anchor";
        this.justify = "end";
        this.offsetX = 8;
        this.offsetY = 8;
        this.keepVisible = true;
    }

    protected connected()
    {
        super.connected();
        this.propShader.property = this.system.components.get(CVScene_old).ins.shader;
    }

    protected disconnected()
    {
        super.disconnected();
        this.propShader.detach();
    }

    protected render()
    {
        const renderMode = this.propShader.getValue(EShaderMode.Default);

        return html`
            <label>Shading</label>
            <div class="ff-flex-column" @click=${this.onClickRenderMode}>
                <ff-button .index=${EShaderMode.Default} .selectedIndex=${renderMode}
                  text="Standard" title="Display model in standard mode"></ff-button>
                <ff-button .index=${EShaderMode.Clay} .selectedIndex=${renderMode}
                  text="Clay" title="Display model without colors"></ff-button>
                <ff-button .index=${EShaderMode.XRay} .selectedIndex=${renderMode}
                  text="X-Ray" title="Display model in X-Ray mode"></ff-button>
                <ff-button .index=${EShaderMode.Normals} .selectedIndex=${renderMode}
                  text="Normals" title="Display normals"></ff-button>
                <ff-button .index=${EShaderMode.Wireframe} .selectedIndex=${renderMode}
                  text="Wireframe" title="Display model as wireframe"></ff-button>
            </div>
        `;
    }

    protected firstUpdated()
    {
        super.firstUpdated();

        this.setStyle({
            display: "flex",
            flexDirection: "column"
        });

        this.classList.add("sv-popup-menu");
    }

    protected onPropertyChange()
    {
        this.requestUpdate();
    }

    protected onClickRenderMode(event: IButtonClickEvent)
    {
        this.propShader.setValue(event.target.index);
        event.stopPropagation();
    }
}