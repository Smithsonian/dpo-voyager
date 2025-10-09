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
import { INodeChangeEvent } from "@ff/graph/Node";

import "../ui/properties/PropertyBoolean";
import "../ui/properties/PropertyOptions";
import "../ui/properties/PropertySlider";
import "../ui/properties/PropertyColor";

import CVDocument from "./CVDocument";

import CVTool, { types, customElement, html, ToolView } from "./CVTool";
import CVEnvironmentLight from "./lights/CVEnvironmentLight";

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
        this.detachLightListeners();

        this.lights = next ? next.getInnerComponents(CLight).filter((light) => light.ins.enabled.value) : [];

        this.attachLightListeners();
        this.refreshLightOptions();

        this.outs.light.setValue(this.lights[0] ?? null);

        super.onActiveDocument(previous, next);
    }

    protected refreshLightOptions()
    {
        this.ins.light.setOptions(this.lights.map(light => light.node.name));
    }

    protected attachLightListeners()
    {
        this.lights.forEach(light => light.node?.on("change", this.onLightNodeChange, this));
    }

    protected detachLightListeners()
    {
        if (!this.lights) {
            return;
        }

        this.lights.forEach(light => light.node?.off("change", this.onLightNodeChange, this));
    }

    protected onLightNodeChange(event: INodeChangeEvent)
    {
        if (!event || event.what === "name") {
            this.refreshLightOptions();
        }
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

    protected render()
    {
        const tool = this.tool;
        const lights = tool.lights;
        const document = this.activeDocument;

        if (!lights || !document || lights.length == 0) {
            return html`<div class="sv-section sv-centered">No editable lights in this scene.</div>`;
        }

        const activeLight = tool.outs.light.value;
        const navigation = document.setup.navigation;
        const language = document.setup.language;

        const colorInput = html`<sv-property-color .property=${activeLight.ins.color} .compact=${true} .floating=${false} name=${language.getLocalizedString("Color")}></sv-property-color>`;

        const lightDetails = activeLight ? html`<div class="sv-section">
            <ff-button class="sv-section-lead" transparent tabbingIndex="-1" icon="cog"></ff-button>
            <div class="sv-tool-controls">
                <!-- <sv-property-boolean .property=${activeLight.ins.visible} name="Switch"></sv-property-boolean> -->
                <sv-property-slider .property=${activeLight.ins.intensity} name=${language.getLocalizedString("Intensity")} min="0" max="2"></sv-property-slider>
                ${!activeLight.is(CVEnvironmentLight) ? colorInput : null}
            </div>
        </div>` : null;

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

    protected async setFocus()
    {
        await this.updateComplete;
        const focusElement = this.getElementsByTagName("sv-property-options")[0] as HTMLElement;
        focusElement?.focus();
    }

    protected onClose(event: MouseEvent)
    {
        this.parentElement.dispatchEvent(new CustomEvent("close"));
        event.stopPropagation();
    }
}