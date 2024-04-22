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

import Subscriber from "@ff/core/Subscriber";

import CVAnalytics from "../../components/CVAnalytics";
import CVDocument from "../../components/CVDocument";
import CVARManager from "../../components/CVARManager";

import DocumentView, { customElement, html } from "./DocumentView";
import CVAnnotationView from "client/components/CVAnnotationView";
import CVScene from "client/components/CVScene";

////////////////////////////////////////////////////////////////////////////////

@customElement("sv-ar-menu")
export default class ARMenu extends DocumentView
{
    protected documentProps = new Subscriber("value", this.onUpdate, this);
    protected shareButtonSelected = false;

    protected get analytics() {
        return this.system.getMainComponent(CVAnalytics);
    }
    protected get arManager() {
        return this.system.getMainComponent(CVARManager);
    }
    protected get sceneNode() {
        return this.system.getComponent(CVScene);
    }

    protected firstConnected()
    {
        super.firstConnected();
        this.classList.add("sv-ar-menu-container");
    }

    protected connected()
    {
        super.connected();
    }

    protected disconnected()
    {
        super.disconnected();
    }

    protected render()
    {
        const document = this.activeDocument;
        if (!document) {
            return html``;
        }

        const arManager = this.arManager;
        const outs = arManager.outs;

        const setup = document.setup;
        const scene = this.sceneNode;

        const views = scene.getGraphComponents(CVAnnotationView);
        const annotationsButtonVisible = views.some(view => {return view.hasAnnotations;});
        const annotationsActive = setup.viewer.ins.annotationsVisible.value;

        const narrationButtonVisible = setup.audio.outs.narrationEnabled.value;
        const narrationActive = setup.audio.outs.narrationPlaying.value;

        return outs.isPlaced.value && outs.isPresenting.value ? html`<div class="sv-ar-menu">
        ${annotationsButtonVisible ? html`<ff-button icon="comment" title="Show/Hide Annotations"
            ?selected=${annotationsActive} @click=${this.onToggleAnnotations}></ff-button>` : null}
        ${narrationButtonVisible ? html`<ff-button icon="audio" title=${"Play Audio Narration"}
            ?selected=${narrationActive} @click=${this.onToggleNarration}></ff-button>` : null}
        </div>` : null;
    }

    protected onToggleReader()
    {
        const readerIns = this.activeDocument.setup.reader.ins;
        readerIns.enabled.setValue(!readerIns.enabled.value);

        this.analytics.sendProperty("Reader_Enabled", readerIns.enabled.value);
    }

    protected onToggleNarration()
    {
        const audio = this.activeDocument.setup.audio;
        audio.setupAudio();  // required for Safari compatibility
        audio.ins.playNarration.set();
    }

    protected onToggleAnnotations()
    {
        //const toolIns = this.toolProvider.ins;
        const viewerIns = this.activeDocument.setup.viewer.ins;

        /*if (toolIns.visible.value) {
            toolIns.visible.setValue(false);
        }*/

        viewerIns.annotationsVisible.setValue(!viewerIns.annotationsVisible.value);
        this.analytics.sendProperty("Annotations_Visible", viewerIns.annotationsVisible.value);
    }

    protected onActiveDocument(previous: CVDocument, next: CVDocument)
    {
        if (previous) {
            this.documentProps.off();

            this.arManager.outs.isPlaced.off("value", this.onUpdate, this);
            this.arManager.outs.isPresenting.off("value", this.onUpdate, this);
        }
        if (next) {
            const setup = next.setup;

            this.documentProps.on(
                setup.viewer.ins.annotationsVisible,
                setup.audio.outs.narrationPlaying,
            );

            this.arManager.outs.isPlaced.on("value", this.onUpdate, this);
            this.arManager.outs.isPresenting.on("value", this.onUpdate, this);
        }

        this.requestUpdate();
    }
}