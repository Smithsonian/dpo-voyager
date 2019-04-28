/**
 * 3D Foundation Project
 * Copyright 2019 Smithsonian Institution
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
import { ETapeState } from "./CVTape";

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
            const units = document.root.scene.ins.units.getOptionText();
            text = `${distance.toFixed(2)} ${units}`;
        }
        else {
            text = "Tap on model to set end of tape.";
        }

        return html`<div class="sv-section"><ff-button class="sv-section-lead" transparent icon=${tool.icon}></ff-button>
            <div class="sv-tool-controls">
                <sv-property-boolean .property=${visible} name="Tape Tool"></sv-property-boolean>
                <div class="sv-property-view"><label class="ff-label ff-off">Measured Distance</label>
                <div class="ff-string">${text}</div></div>
            </div></div>`;
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
}