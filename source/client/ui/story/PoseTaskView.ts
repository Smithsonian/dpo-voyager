/**
 * 3D Foundation Project
 * Copyright 2025 Smithsonian Institution
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

import { customElement, html } from "@ff/ui/CustomElement";

import "@ff/ui/Splitter";
import "@ff/ui/Button";
import { IButtonClickEvent } from "@ff/ui/Button";
import CRenderer from "@ff/scene/components/CRenderer";
import RenderQuadView from "@ff/scene/RenderQuadView";

import "./PropertyView";

import CVPoseTask, { EPoseManipMode } from "../../components/CVPoseTask";
import { TaskView } from "../../components/CVTask";
import CVDocument from "../../components/CVDocument";
import CVSunLight from "../../components/lights/CVSunLight";
import { IComponentEvent } from "@ff/graph/Component";
import { EUnitType } from "client/schema/model";
import CompassController from "../CompassController";

////////////////////////////////////////////////////////////////////////////////

/**
 * View component for [[CVPoseTask]].
 *
 * Allows selecting the pose edit mode (select, rotate, move) and provides commands for centering the model
 * and zoom/center the view to the extents of the scene.
 */
@customElement("sv-pose-task-view")
export default class PoseTaskView extends TaskView<CVPoseTask>
{
    protected compass: CompassController;
    private sunLights = new Set<CVSunLight>();

    protected firstConnected()
    {
        super.firstConnected();
        this.compass = new CompassController(this.system);
    }

    protected connected()
    {
        super.connected();
        const quadView = this.system.getMainComponent(CRenderer).views.find(
            (view): view is RenderQuadView => view instanceof RenderQuadView
        );
        const firstViewportOverlay = quadView?.viewports[0]?.overlay;
        if (!firstViewportOverlay) {
            throw new Error("Pose view compass requires a first viewport overlay");
        }
        firstViewportOverlay.appendChild(this.compass.element);
        this.compass.connect();
        this.system.components.on(CVSunLight, this.onSunlightComponent, this);
        this.updateSunlights(this.activeDocument);
        this.task.on("update", this.onUpdate, this);
        this.task.outs.size.on("value", this.onUpdate, this);
    }

    protected disconnected()
    {
        this.system.components.off(CVSunLight, this.onSunlightComponent, this);
        this.updateSunlights(null);
        this.compass.disconnect();
        this.compass.element.remove();
        this.task.outs.size.off("value", this.onUpdate, this);
        this.task.off("update", this.onUpdate, this);
        super.disconnected();
    }

    protected render()
    {
        if(!this.activeDocument) {
            return;
        }
        const hasActiveSunlight = [...this.sunLights].some(sunlight => sunlight.ins.enabled.value);
        this.compass.setVisible(hasActiveSunlight);

        const node = this.activeNode;
        const model = node && node.model;
        const languageManager = this.activeDocument.setup.language;

        if (!model) {
            return html`<div class="sv-placeholder">${languageManager.getUILocalizedString("Please select a model to edit its pose")}</div>`;
        }

        const size = this.task.outs.size.value;
        const dimensions = `${size[0].toFixed(2)} x ${size[1].toFixed(2)} x ${size[2].toFixed(2)} ${EUnitType[model.ins.globalUnits.value]}`;

        const modeProp = this.task.ins.mode;

        const globalUnits = this.activeDocument.root.scene.ins.units;
        const itemUnits = model.ins.localUnits;
        const position = model.ins.position;
        const rotation = model.ins.rotation;

        return html`
            <div class="sv-commands">
                <ff-button icon="select" text="${languageManager.getUILocalizedString("Select")}" index=${EPoseManipMode.Off} selectedIndex=${modeProp.value} @click=${this.onClickMode}></ff-button>
                <ff-button icon="rotate" text="${languageManager.getUILocalizedString("Rotate")}" index=${EPoseManipMode.Rotate} selectedIndex=${modeProp.value} @click=${this.onClickMode}></ff-button>
                <ff-button icon="move" text="${languageManager.getUILocalizedString("Move")}" index=${EPoseManipMode.Translate} selectedIndex=${modeProp.value} @click=${this.onClickMode}></ff-button>
                <ff-button icon="compress" text="${languageManager.getUILocalizedString("Center")}" @click=${this.onClickCenter}></ff-button>
                <ff-button icon="expand" text="${languageManager.getUILocalizedString("Zoom Extents")}" @click=${this.onClickZoomExtents}></ff-button>
            </div>
            <div class="ff-flex-item-stretch"><div class="ff-scroll-y ff-flex-column sv-detail-view">
                <div class="sv-label-right">${dimensions}</div>
                <sv-property-view .property=${globalUnits} label="Global Units"></sv-property-view>    
                <sv-property-view .property=${itemUnits} label="Item Units"></sv-property-view>
                <sv-property-view .property=${position}></sv-property-view>
                <sv-property-view .property=${rotation}></sv-property-view>
            </div></div>`;
    }

    protected onActiveDocument(_previous: CVDocument, next: CVDocument)
    {
        this.updateSunlights(next);
    }

    private onSunlightComponent(_event: IComponentEvent<CVSunLight>)
    {
        this.updateSunlights(this.activeDocument);
    }

    private updateSunlights(document: CVDocument)
    {
        const nextSunLights = new Set(document?.getInnerComponents(CVSunLight) ?? []);
        this.sunLights.forEach(sunlight => {
            if (!nextSunLights.has(sunlight)) {
                sunlight.ins.enabled.off("value", this.onUpdate, this);
                this.sunLights.delete(sunlight);
            }
        });
        nextSunLights.forEach(sunlight => {
            if (!this.sunLights.has(sunlight)) {
                sunlight.ins.enabled.on("value", this.onUpdate, this);
                this.sunLights.add(sunlight);
            }
        });
        this.onUpdate();
    }

    protected onClickMode(event: IButtonClickEvent)
    {
        this.task.ins.mode.setValue(event.target.index);
    }

    protected onClickCenter()
    {
        this.activeNode.model.ins.center.set();
    }

    protected onClickZoomExtents()
    {
        this.activeDocument.setup.navigation.ins.zoomExtents.set();
    }
}
