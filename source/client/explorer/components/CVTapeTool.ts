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
import { IActiveDocumentEvent } from "@ff/graph/components/CDocumentManager";

import "../ui/PropertyBoolean";
import "../ui/PropertyString";

import CVTape, { ETapeState } from "./CVTape";
import CVTool, { ToolView, customElement, html } from "./CVTool";

////////////////////////////////////////////////////////////////////////////////

export default class CVTapeTool extends CVTool
{
    static readonly typeName: string = "CVTapeTool";

    static readonly text = "Tape Measure";
    static readonly icon = "tape";

    protected static readonly tapeIns = {
        enabled: types.Boolean("Tape.Enabled"),
    };

    protected static readonly tapeOuts = {
        text: types.String("Tape.Text"),
    };

    ins = this.addInputs(CVTapeTool.tapeIns);
    outs = this.addOutputs(CVTapeTool.tapeOuts);

    protected get tape() {
        const document = this.activeDocument;
        return document ? document.getInnerComponent(CVTape) : null;
    }

    update(context)
    {
        const ins = this.ins;

        if (ins.enabled.changed) {
            const tape = this.tape;
            if (tape) {
                tape.ins.visible.setValue(ins.enabled.value);
            }
        }

        return true;
    }

    createView()
    {
        return new TapeToolView(this);
    }

    protected onActiveDocument(event: IActiveDocumentEvent)
    {
        if (event.previous) {
            const tape = event.previous.getInnerComponent(CVTape);
            tape.outs.state.off("value", this.updateTapeState, this);
            tape.outs.distance.off("value", this.updateTapeState, this);
        }


        if (event.next) {
            const tape = event.next.getInnerComponent(CVTape);
            tape.outs.state.on("value", this.updateTapeState, this);
            tape.outs.distance.on("value", this.updateTapeState, this);
        }
    }

    protected updateTapeState()
    {
        const tape = this.tape;

        if (tape) {
            const state = tape.outs.state.value;
            const distance = tape.outs.distance.value;
            const text = this.outs.text;

            if (!this.ins.enabled.value) {
                text.setValue("Switch on to take measurements.");
            }
            else if (distance === 0) {
                text.setValue("Tap on model to set start of tape.");
            }
            else if (state === ETapeState.SetStart) {
                text.setValue(`${distance.toFixed(2)} units.`);
            }
            else {
                text.setValue("Tap on model to set end of tape.");
            }
        }
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
        const enabled = this.tool.ins.enabled;
        const text = this.tool.outs.text;


        return html`<sv-property-boolean .property=${enabled} name="Tape Tool"></sv-property-boolean>
            <sv-property-string .property=${text} name="Measured Distance"></sv-property-string>`;
    }
}