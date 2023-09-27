/**
 * 3D Foundation Project
 * Copyright 2023 Smithsonian Institution
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
import CVAudioManager from "../../components/CVAudioManager";

import DocumentView, { customElement, html } from "./DocumentView";

////////////////////////////////////////////////////////////////////////////////

@customElement("sv-caption-view")
export default class CaptionView extends DocumentView
{
    protected audioManager: CVAudioManager = null;

    protected firstConnected()
    {
        super.firstConnected();
        this.classList.add("sv-caption-view");
    }

    protected render()
    {
        const audio = this.audioManager;
        const text = audio.ins.activeCaption.value;
        const isShowing = audio.ins.captionsEnabled.value;

        return (text.length > 0) && isShowing ? html`<div class="sv-caption-box" >${text}</div>` : null;
    }

    protected onActiveDocument(previous: CVDocument, next: CVDocument)
    {
        if (previous) {
            previous.setup.audio.ins.activeCaption.off("value", this.onUpdate, this);
            previous.setup.audio.ins.captionsEnabled.off("value", this.onUpdate, this);
            this.audioManager = null;
        }
        if (next) {
            this.audioManager = next.setup.audio;
            next.setup.audio.ins.captionsEnabled.on("value", this.onUpdate, this);
            next.setup.audio.ins.activeCaption.on("value", this.onUpdate, this);
        }

        this.requestUpdate();
    }
}