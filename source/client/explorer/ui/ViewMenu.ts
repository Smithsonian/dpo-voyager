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

import "@ff/ui/Layout";
import "@ff/ui/Button";
import { IButtonClickEvent } from "@ff/ui/Button";
import "@ff/ui/IndexButton";

import { customElement, html, property } from "@ff/ui/CustomElement";
import Popup from "@ff/ui/Popup";

import SystemController from "../../../core/components/SystemController";
import OrbitManip, { EProjectionType, EViewPreset } from "../../../core/components/OrbitManip";

////////////////////////////////////////////////////////////////////////////////

@customElement("sv-view-menu")
export default class ViewMenu extends Popup
{
    @property({ attribute: false })
    controller: SystemController;

    protected viewPreset: EViewPreset;

    constructor()
    {
        super();

        this.viewPreset = EViewPreset.None;
        this.position = "anchor";
        this.justify = "end";
        this.offsetX = 8;
        this.offsetY = 8;
        this.keepVisible = true;
    }

    protected connected()
    {
        super.connected();
        this.controller.addOutputListener(OrbitManip, "View.Projection", this.requestUpdate, this);
        this.controller.addOutputListener(OrbitManip, "View.Preset", this.requestUpdate, this);

    }

    protected disconnected()
    {
        super.disconnected();
        this.controller.removeOutputListener(OrbitManip, "View.Projection", this.requestUpdate, this);
        this.controller.removeOutputListener(OrbitManip, "View.Preset", this.requestUpdate, this);

    }

    protected render()
    {
        const projectionType = this.controller.getOutputValue(OrbitManip, "View.Projection");
        const viewPreset = this.controller.getOutputValue(OrbitManip, "View.Preset");

        return html`
            <label>Projection</label>
            <ff-flex-row @click=${this.onClickProjectionType}>
                <ff-index-button .index=${EProjectionType.Perspective} .selectedIndex=${projectionType}
                  text="Perspective" title="Perspective Projection" icon="fas fa-video"></ff-index-button>    
                <ff-index-button .index=${EProjectionType.Orthographic} .selectedIndex=${projectionType}
                  text="Orthographic" title="Orthographic Projection" icon="fas fa-video"></ff-index-button>    
            </ff-flex-row>
            <label>View</label>
            <ff-grid class="sv-cube" justifyContent="center" @click=${this.onClickViewPreset}>
                <ff-index-button .index=${EViewPreset.Top} .selectedIndex=${viewPreset}
                  text="T" title="Top View" style="grid-column-start: 2; grid-row-start: 1;"></ff-index-button>
                <ff-index-button .index=${EViewPreset.Left} .selectedIndex=${viewPreset}
                  text="L" title="Left View" style="grid-column-start: 1; grid-row-start: 2;"></ff-index-button>
                <ff-index-button .index=${EViewPreset.Front} .selectedIndex=${viewPreset}
                  text="F" title="Front View" style="grid-column-start: 2; grid-row-start: 2;"></ff-index-button>
                <ff-index-button .index=${EViewPreset.Right} .selectedIndex=${viewPreset}
                  text="R" title="Right View" style="grid-column-start: 3; grid-row-start: 2;"></ff-index-button>
                <ff-index-button .index=${EViewPreset.Back} .selectedIndex=${viewPreset}
                  text="B" title="Back View" style="grid-column-start: 4; grid-row-start: 2;"></ff-index-button>
                <ff-index-button .index=${EViewPreset.Bottom} .selectedIndex=${viewPreset}
                  text="B" title="Bottom View" style="grid-column-start: 2; grid-row-start: 3;"></ff-index-button>
            </ff-grid>
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

    protected onClickProjectionType(event: IButtonClickEvent)
    {
        this.controller.actions.setInputValue(OrbitManip, "View.Projection", event.target.index);
        event.stopPropagation();
    }

    protected onClickViewPreset(event: IButtonClickEvent)
    {
        this.controller.actions.setInputValue(OrbitManip, "View.Preset", event.target.index);
        event.stopPropagation();
    }
}