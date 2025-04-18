/**
 * 3D Foundation Project
 * Copyright 2024 Smithsonian Institution
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

import "../ui/properties/PropertyBoolean";
import "../ui/properties/PropertyString";

import CVDocument from "./CVDocument";
import CVTape, { ETapeState } from "./CVTape";

import CVTool, { ToolView, customElement, html } from "./CVTool";

////////////////////////////////////////////////////////////////////////////////

export default class CVTapeTool extends CVTool
{
    static readonly typeName: string = "CVTapeTool";

    static readonly text = "Measure";
    static readonly icon = "tape";

    createView()
    {
        return new TapeToolView(this);
    }
}

////////////////////////////////////////////////////////////////////////////////

@customElement("sv-tape-tool-view")
export class TapeToolView extends ToolView<CVTapeTool>
{
    protected firstMeasureRender: boolean = true;
    protected firstDecompositionRender: boolean = true;
    protected distanceMsg: string = "";
    protected axisMessages: Array<string> = ["","",""];

    protected firstConnected()
    {
        super.firstConnected();
        this.classList.add("sv-group", "sv-tape-tool-view");
    }

    protected render()
    {
        const document = this.activeDocument;

        if (!document) {
            return html``;
        }

        const tool = this.tool;
        const tape = document.setup.tape;
        const enabled = tape.ins.enabled;
        const decompositionEnabled = tape.ins.decompositionEnabled;
        const state = tape.outs.state.value;
        const distance = tape.outs.distance.value;
        const language = document.setup.language;
        const distanceVector = tape.outs.distanceVector.value;

        let text;
        let axisDecompositionText= ["","",""];

        if (!enabled.value) {
            text = language.getLocalizedString("Switch on to take measurements") + ".";
        }
        else if (distance === 0) {
            text = language.getLocalizedString("Tap on model to set start of tape") + ".";
        }
        else if (state === ETapeState.SetStart) {
            const units = document.root.scene.ins.units.getOptionText();
            text = `${distance.toFixed(2)} ${units}`;
            if (decompositionEnabled.value) {
                axisDecompositionText = distanceVector.map((val)=>(`${Math.abs(val).toFixed(2)} ${units}`) )
            }
        }
        else {
            text = language.getLocalizedString("Tap on model to set end of tape") + ".";
        }

        this.distanceMsg = text;
        this.axisMessages = axisDecompositionText;

        return html`<div class="sv-section"><ff-button class="sv-section-lead" title=${language.getLocalizedString("Close Tool")} @click=${this.onClose} transparent icon="close"></ff-button>
            <div class="sv-tool-controls">
                <sv-property-boolean .property=${enabled} .language=${language} name=${language.getLocalizedString("Tape Tool")}></sv-property-boolean>
                <div class="sv-property-view" style="min-width: 10%"><label class="ff-label ff-off">${language.getLocalizedString("Measured Distance")}</label>
                <div class="ff-string" aria-live="polite" aria-atomic="true"></div></div>
                <sv-property-boolean .property=${decompositionEnabled} .language=${language} name=${language.getLocalizedString("Decomposition")}></sv-property-boolean>
                <div class="sv-property-view" style="min-width: 10%"><label class="ff-label ff-off" style="color:#${CVTape.axisColors.x.getHexString()}">${language.getLocalizedString("X axis")}</label>
                <div class="ff-string axisMeasure" aria-live="polite" aria-atomic="true"></div></div>
                <div class="sv-property-view" style="min-width: 10%"><label class="ff-label ff-off" style="color:#${CVTape.axisColors.y.getHexString()}">${language.getLocalizedString("Y axis")}</label>
                <div class="ff-string axisMeasure" aria-live="polite" aria-atomic="true"></div></div>
                <div class="sv-property-view" style="min-width: 10%"><label class="ff-label ff-off" style="color:#${CVTape.axisColors.z.getHexString()}">${language.getLocalizedString("Z axis")}</label>
                <div class="ff-string axisMeasure" aria-live="polite" aria-atomic="true"></div></div>
            </div></div>`;
    }

    protected updated(changedProperties): void
    {
        super.updated(changedProperties);

        const distanceContainer = this.getElementsByClassName("ff-string").item(0) as HTMLElement;
        if(distanceContainer) {
            distanceContainer.innerHTML = this.distanceMsg;
            // Hack so that initial status message is detected by screen readers.
            if(this.firstMeasureRender) {
                setTimeout(() => {distanceContainer.innerHTML = `<div>${this.distanceMsg}</div>`}, 200);
                this.firstMeasureRender = false;
            }
        }

        const axisMeasurementContainers = this.getElementsByClassName("axisMeasure");
        if (axisMeasurementContainers){
            for (let i = 0; i < 3; i ++){
                let container = axisMeasurementContainers.item(i) as HTMLElement;
                container.innerHTML= this.axisMessages[i]
                // Hack so that initial status message is detected by screen readers.
                if(this.firstDecompositionRender) {
                    setTimeout(() => {container.innerHTML = `<div>${this.axisMessages[i]}</div>`}, 200);
                    this.firstDecompositionRender = false;
                }
            }    
        }
    }

    protected onActiveDocument(previous: CVDocument, next: CVDocument)
    {
        if (previous) {
            previous.setup.tape.off("update", this.onUpdate, this);
        }
        if (next) {
            next.setup.tape.on("update", this.onUpdate, this);
        }

        this.requestUpdate();
    }

    protected async setFocus()
    {
        await this.updateComplete;
        const focusElement = this.getElementsByTagName("ff-button")[1] as HTMLElement;
        focusElement.focus();
    }

    protected onClose(event: MouseEvent)
    {
        this.parentElement.dispatchEvent(new CustomEvent("close"));
        event.stopPropagation();
    }
}