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

import CVDocument from "../../components/CVDocument";
import CVARManager from "../../components/CVARManager";

import DocumentView, { customElement, html } from "./DocumentView";

////////////////////////////////////////////////////////////////////////////////

@customElement("sv-ar-prompt-container")
export default class ARPrompt extends DocumentView
{
    protected get arManager() {
        return this.system.getMainComponent(CVARManager);
    }

    protected firstConnected()
    {
        super.firstConnected();

        //this.classList.add("sv-ar-prompt" /*, "sv-transition"*/);
        //setTimeout(() => this.classList.remove("sv-transition"), 1);
    }

    protected render()
    {
        const arManager = this.arManager;
        const outs = arManager.outs;
        const location = arManager.ins.wallMount.value === true ? "a wall" : "the floor";

        return !outs.isPlaced.value && outs.isPresenting.value ? html`<div class="sv-ar-prompt">
                <div class="sv-content">
                    <div><ff-icon class="ff-off ff-icon sv-ar-icon" name="device-move"}></ff-icon></div>
                    Point your device at ${location} and move it around to place your Smithsonian object!<br><br>**BETA**
                </div>
            </div>` : null;
    }

    protected onActiveDocument(previous: CVDocument, next: CVDocument)
    {
        if (previous) {
            this.arManager.outs.isPlaced.off("value", this.onUpdate, this);
            this.arManager.outs.isPresenting.off("value", this.onUpdate, this);
        }
        if (next) {
            this.arManager.outs.isPlaced.on("value", this.onUpdate, this);
            this.arManager.outs.isPresenting.on("value", this.onUpdate, this);
        }

        this.requestUpdate();
    }
}