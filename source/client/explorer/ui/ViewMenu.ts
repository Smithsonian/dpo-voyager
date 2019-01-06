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
import RenderSystem from "@ff/scene/RenderSystem";

import "@ff/ui/Layout";
import "@ff/ui/IndexButton";
import "@ff/ui/Button";
import { IButtonClickEvent } from "@ff/ui/Button";

import View, { EProjectionType, EViewPreset } from "../components/View";

import { customElement, html, property } from "@ff/ui/CustomElement";
import Popup from "@ff/ui/Popup";

////////////////////////////////////////////////////////////////////////////////

@customElement("sv-view-menu")
export default class ViewMenu extends Popup
{
    @property({ attribute: false })
    system: RenderSystem;

    protected viewPreset: EViewPreset;
    protected propProjection: PropertyTracker<EProjectionType>;
    protected propPreset: PropertyTracker<EViewPreset>;

    constructor(system?: RenderSystem)
    {
        super();

        this.system = system;
        this.viewPreset = EViewPreset.None;
        this.propProjection = new PropertyTracker(this.onPropertyChange, this);
        this.propPreset = new PropertyTracker(this.onPropertyChange, this);

        this.position = "anchor";
        this.align = "center";
        this.justify = "end";
        this.offsetX = 8;
        this.offsetY = 8;
        this.keepVisible = true;
    }

    protected connected()
    {
        super.connected();

        this.propProjection.property = this.system.components.get(View).ins.projection;
        this.propPreset.property = this.system.components.get(View).ins.preset;
        this.requestUpdate();

    }

    protected disconnected()
    {
        super.disconnected();

        this.propProjection.detach();
        this.propPreset.detach();
    }

    protected render()
    {
        const projection = this.propProjection.getValue();
        const preset = this.propPreset.getValue();

        return html`
            <label>Projection</label>
            <ff-flex-row @click=${this.onClickProjectionType}>
                <ff-index-button .index=${EProjectionType.Perspective} .selectedIndex=${projection}
                  text="Perspective" title="Perspective Projection" icon="fas fa-video"></ff-index-button>    
                <ff-index-button .index=${EProjectionType.Orthographic} .selectedIndex=${projection}
                  text="Orthographic" title="Orthographic Projection" icon="fas fa-video"></ff-index-button>    
            </ff-flex-row>
            <label>View</label>
            <ff-grid class="sv-cube" justifyContent="center" @click=${this.onClickViewPreset}>
                <ff-index-button .index=${EViewPreset.Top} .selectedIndex=${preset}
                  text="T" title="Top View" style="grid-column-start: 2; grid-row-start: 1;"></ff-index-button>
                <ff-index-button .index=${EViewPreset.Left} .selectedIndex=${preset}
                  text="L" title="Left View" style="grid-column-start: 1; grid-row-start: 2;"></ff-index-button>
                <ff-index-button .index=${EViewPreset.Front} .selectedIndex=${preset}
                  text="F" title="Front View" style="grid-column-start: 2; grid-row-start: 2;"></ff-index-button>
                <ff-index-button .index=${EViewPreset.Right} .selectedIndex=${preset}
                  text="R" title="Right View" style="grid-column-start: 3; grid-row-start: 2;"></ff-index-button>
                <ff-index-button .index=${EViewPreset.Back} .selectedIndex=${preset}
                  text="B" title="Back View" style="grid-column-start: 4; grid-row-start: 2;"></ff-index-button>
                <ff-index-button .index=${EViewPreset.Bottom} .selectedIndex=${preset}
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
        this.propProjection.setValue(event.target.index);
        event.stopPropagation();
    }

    protected onClickViewPreset(event: IButtonClickEvent)
    {
        this.propPreset.setValue(event.target.index);
        event.stopPropagation();
    }

    protected onPropertyChange()
    {
        this.requestUpdate();
    }
}