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
import CVAudioManager from "../../components/CVAudioManager";

import DocumentView, { customElement, html } from "./DocumentView";
import Subscriber from "@ff/core/Subscriber";

////////////////////////////////////////////////////////////////////////////////

@customElement("sv-caption-view")
export default class CaptionView extends DocumentView
{
    protected audioManager: CVAudioManager = null;
    protected documentProps = new Subscriber("value", this.onUpdate, this);

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
            this.documentProps.off();
        }
        if (next) {
            const setup = next.setup;
            this.audioManager = next.setup.audio;

            this.documentProps.on(
                setup.audio.ins.captionsEnabled,
                setup.audio.ins.activeCaption,
            );
        }

        this.requestUpdate();
    }
}