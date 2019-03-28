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

import "../ui/PropertyBoolean";
import "../ui/PropertyString";

import CVDocument from "./CVDocument";
import CVScene from "./CVScene";
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
    protected firstConnected()
    {
        super.firstConnected();
        this.classList.add("sv-tape-tool-view");
    }

    protected render()
    {
        const scene = this.activeScene;

        if (!scene) {
            return html``;
        }

        const tape = scene.tape;
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

    protected onActiveScene(previous: CVScene, next: CVScene)
    {
        if (previous) {
            previous.tape.off("update", this.onUpdate, this);
        }
        if (next) {
            next.tape.on("update", this.onUpdate, this);
        }
    }
}