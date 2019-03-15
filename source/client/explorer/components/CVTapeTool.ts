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

import { types } from "@ff/graph/Component";

import "../ui/PropertyBoolean";
import "../ui/PropertyString";

import CVScene_old from "../../core/components/CVScene_old";
import CVTape, { ETapeState } from "./CVTape";

import CVDocument_old from "./CVDocument_old";
import CVTool, { ToolView, customElement, html } from "./CVTool";

////////////////////////////////////////////////////////////////////////////////

export default class CVTapeTool extends CVTool
{
    static readonly typeName: string = "CVTapeTool";

    static readonly text = "Measure";
    static readonly icon = "tape";

    protected static readonly outs = {
        tape: types.Object("Components.Tape", CVTape),
        scene: types.Object("Components.Scene", CVScene_old),
    };

    outs = this.addOutputs<CVTool, typeof CVTapeTool.outs>(CVTapeTool.outs);

    protected get tape() {
        const document = this.activeDocument;
        return document ? document.getInnerComponent(CVTape) : null;
    }
    protected get scene() {
        const document = this.activeDocument;
        return document ? document.getInnerComponent(CVScene_old) : null;
    }

    createView()
    {
        return new TapeToolView(this);
    }

    protected onActiveDocument(previous: CVDocument_old, next: CVDocument_old)
    {
        super.onActiveDocument(previous, next);

        this.outs.tape.setValue(next ? next.getInnerComponent(CVTape) : null);
        this.outs.scene.setValue(next ? next.getInnerComponent(CVScene_old) : null);
    }
}

////////////////////////////////////////////////////////////////////////////////

@customElement("sv-tape-tool-view")
export class TapeToolView extends ToolView<CVTapeTool>
{
    protected tape: CVTape = null;

    protected firstConnected()
    {
        super.firstConnected();
        this.classList.add("sv-tape-tool-view");
    }

    protected connected()
    {
        super.connected();
        const tapeProp = this.tool.outs.tape;
        tapeProp.on("value", this.onTape, this);
        this.onTape(tapeProp.value);
    }

    protected disconnected()
    {
        this.onTape(null);
        this.tool.outs.tape.off("value", this.onTape, this);
        super.disconnected();
    }

    protected render()
    {
        const tape = this.tape;

        if (!tape) {
            return html``;
        }

        const scene = tape.getGraphComponent(CVScene_old);
        const visible = tape.ins.visible;
        const state = tape.outs.state.value;
        const distance = tape.outs.distance.value;

        let text;

        if (!visible.value) {
            text = "Switch on to take measurements.";
        }
        else if (distance === 0) {
            text = "Tap on model to set start of tape.";
        }
        else if (state === ETapeState.SetStart) {
            const units = scene.ins.units.getOptionText();
            text = `${distance.toFixed(2)} ${units}`;
        }
        else {
            text = "Tap on model to set end of tape.";
        }

        return html`<sv-property-boolean .property=${visible} name="Tape Tool"></sv-property-boolean>
            <div class="sv-property-view"><label class="ff-label ff-off">Measured Distance</label>
            <div class="ff-string">${text}</div></div>`;
    }

    protected onTape(tape: CVTape)
    {
        if (this.tape) {
            this.tape.off("update", this.performUpdate, this);
        }
        if (tape) {
            tape.on("update", this.performUpdate, this);
        }

        this.tape = tape;
    }
}