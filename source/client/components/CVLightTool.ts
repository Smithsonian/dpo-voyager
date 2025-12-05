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

import CLight from "@ff/scene/components/CLight";
import { IComponentEvent } from "@ff/graph/Component";

import "../ui/properties/PropertyBoolean";
import "../ui/properties/PropertyOptions";
import "../ui/properties/PropertySlider";
import "../ui/properties/PropertyColor";
import "../ui/properties/PropertyString";
import "../ui/properties/PropertyDateTime";

import CVDocument from "./CVDocument";

import CVTool, { types, customElement, html, ToolView } from "./CVTool";
import CVEnvironmentLight from "./lights/CVEnvironmentLight";
import NVNode from "client/nodes/NVNode";
import CSunLight from "@ff/scene/components/CSunLight";

////////////////////////////////////////////////////////////////////////////////

export default class CVLightTool extends CVTool
{
    static readonly typeName: string = "CVLightTool";

    static readonly text = "Lights";
    static readonly icon = "bulb";

    lights: Readonly<CLight[]> = [];

    protected static readonly ins = {
        light: types.Option("Tool.Light", []),
    };

    protected static readonly outs = {
        light: types.Object("Tool.SelectedLight", CLight),
    };

    ins = this.addInputs(CVLightTool.ins);
    outs = this.addOutputs(CVLightTool.outs);

    update(context)
    {
        this.outs.light.setValue(this.lights[this.ins.light.getValidatedValue()]);
        return true;
    }

    createView()
    {
        return new LightToolView(this);
    }

    protected onActiveDocument(previous: CVDocument, next: CVDocument)
    {
        this.lights = next ? next.getInnerComponents(CLight).filter((light) => light.ins.enabled.value) : [];
        this.ins.light.setOptions(this.lights.map(light => light.ins.name.value));
        this.outs.light.setValue(this.lights[0] ?? null);

        super.onActiveDocument(previous, next);
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
        this.classList.add("sv-group", "sv-light-tool-view");
    }

    protected connected()
    {
        super.connected();
        this.tool.outs.light.on("value", this.onUpdate, this);
    }

    protected disconnected()
    {
        this.tool.outs.light.off("value", this.onUpdate, this);
        super.disconnected();
    }

    private renderSunLightProperties(light: CSunLight, language): unknown {
        return html`
            <sv-property-datetime input="datetime-local" .property=${light.ins.datetime} name=${language.getLocalizedString("Date/Time")}></sv-property-datetime>
            <sv-property-timezone .property=${light.ins.datetime} name=${language.getLocalizedString("Time Zone")}></sv-property-timezone>
            <sv-property-number .property=${light.ins.latitude} name=${language.getLocalizedString("Latitude")} min="-90" max="90"></sv-property-number>
            <sv-property-number .property=${light.ins.longitude} name=${language.getLocalizedString("Longitude")} min="-180" max="180"></sv-property-number>
        `;
    }

    private renderCommonLightProperties(light: CLight, language): unknown {
        return html`
                <!-- <sv-property-boolean .property=${light.ins.visible} name="Switch"></sv-property-boolean> -->
                <sv-property-slider .property=${light.ins.intensity} name=${language.getLocalizedString("Intensity")} min="0" max="10"></sv-property-slider>
        `;
    }

    private renderColorInput(light: CLight, language): unknown {
        return html`<sv-property-color .property=${light.ins.color} .compact=${true} .floating=${false} name=${language.getLocalizedString("Color")}></sv-property-color>`;
    }
    
    protected render()
    {
        const tool = this.tool;
        const lights = tool.lights;
        const document = this.activeDocument;

        if (!lights || !document) {
            return html`No editable lights in this scene.`;
        }

        const activeLight = tool.outs.light.value;
        const navigation = document.setup.navigation;
        const language = document.setup.language;

        var lightDetails = null;

        if (activeLight) {
            var lightControls = null;

            if (activeLight.is(CSunLight)) {
                lightControls = this.renderSunLightProperties(activeLight as CSunLight, language);
            } else if (activeLight.is(CVEnvironmentLight)) {
                lightControls = this.renderCommonLightProperties(activeLight, language);
            } else {
                lightControls = html`
                    ${this.renderCommonLightProperties(activeLight, language)}
                    ${this.renderColorInput(activeLight, language)}
                `;
            }

          lightDetails = html`<div class="sv-section">
              <ff-button class="sv-section-lead" transparent tabbingIndex="-1" icon="cog"></ff-button>
              <div class="sv-tool-controls">${lightControls}</div>
          </div>`;
        }

        return html`${lightDetails}<div class="sv-section"><ff-button class="sv-section-lead" title=${language.getLocalizedString("Close Tool")} @click=${this.onClose} transparent icon="close"></ff-button>
            <div class="sv-tool-controls">
                <!-- <sv-property-boolean .property=${navigation.ins.lightsFollowCamera} name="Follow Camera"></sv-property-boolean> -->
                <sv-property-options .property=${tool.ins.light} .language=${language} name=${language.getLocalizedString("Select Scene Light")}></sv-property-options>
            </div>
        </div>`;
    }
    
    protected onActiveDocument(previous: CVDocument, next: CVDocument)
    {
        if (previous) {
            previous.setup.navigation.ins.lightsFollowCamera.off("value", this.onUpdate, this);
        }
        if (next) {
            next.setup.navigation.ins.lightsFollowCamera.on("value", this.onUpdate, this);
        }

        this.requestUpdate();
    }

    protected onActiveNode(previous: NVNode, next: NVNode)
    {
        if (previous && previous.light) {
            previous.light.ins.name.off("value", this.refreshLightList, this);
            previous.light.ins.enabled.off("value", this.refreshLights, this);
        }
        if (next && next.light) {
            next.light.ins.enabled.on("value", this.refreshLights, this);
            next.light.ins.name.on("value", this.refreshLightList, this);
        }
    }

    protected refreshLights() {
        this.tool.lights = this.activeDocument.getInnerComponents(CLight).filter((light) => light.ins.enabled.value);
        this.refreshLightList();
    }

    protected refreshLightList() {
        this.tool.ins.light.setOptions(this.tool.lights.map(light => light.ins.name.value)); 
    }

    protected async setFocus()
    {
        await this.updateComplete;
        const focusElement = this.getElementsByTagName("sv-property-options")[0] as HTMLElement;
        focusElement.focus();
    }

    protected onClose(event: MouseEvent)
    {
        this.parentElement.dispatchEvent(new CustomEvent("close"));
        event.stopPropagation();
    }
}