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

import DocumentView, { customElement, html } from "./DocumentView";

import CVInterface from "../components/CVInterface";
import CVReader from "../components/CVReader";
import CVTours, { EToursState } from "../components/CVTours";
import CVToolProvider from "../components/CVToolProvider";
import CVDocument from "../components/CVDocument";

////////////////////////////////////////////////////////////////////////////////

@customElement("sv-main-menu")
export default class MainMenu extends DocumentView
{
    protected get interface() {
        return this.system.getMainComponent(CVInterface);
    }
    protected get toolProvider() {
        return this.system.getMainComponent(CVToolProvider);
    }

    protected firstConnected()
    {
        super.firstConnected();
        this.classList.add("sv-main-menu");
    }

    protected connected()
    {
        super.connected();

        this.interface.on("update", this.performUpdate, this);
        this.interface.outs.fullscreenEnabled.on("value", this.performUpdate, this);
    }

    protected disconnected()
    {
        this.interface.off("update", this.performUpdate, this);
        this.interface.outs.fullscreenEnabled.off("value", this.performUpdate, this);

        super.disconnected();
    }

    protected onActiveDocument(previous: CVDocument, next: CVDocument)
    {
        if (previous) {
            const scene = previous.documentScene;
            scene.reader.ins.visible.off("value", this.onReaderVisible, this);
            scene.annotations.ins.visible.off("value", this.performUpdate, this);
            //scene.tours.ins.state.off("value", this.performUpdate, this);
            //scene.tours.ins.visible.off("value", this.performUpdate, this);
        }
        if (next) {
            const scene = next.documentScene;
            scene.reader.ins.visible.on("value", this.onReaderVisible, this);
            scene.annotations.ins.visible.on("value", this.performUpdate, this);
            //scene.tours.ins.state.on("value", this.performUpdate, this);
            //scene.tours.ins.visible.on("value", this.performUpdate, this);
        }
    }

    protected render()
    {
        const scene = this.activeDocument.documentScene;
        const readerVisible = scene.reader.ins.visible.value;
        const annotationsVisible = scene.annotations.ins.visible.value;
        const toursVisible = scene.tours.ins.state.value !== EToursState.Off;
        const toolsVisible = scene.tours.ins.visible.value;

        const _interface = this.interface;
        const fullscreenEnabled = _interface.outs.fullscreenEnabled.value;
        const showFullscreenButton = _interface.outs.fullscreenAvailable.value;
        const showToolButton = _interface.ins.tools.value;

        const document = this.activeDocument;

        return html`<ff-button icon="document" title="Read more..."
            ?selected=${readerVisible} @click=${this.onToggleReader}></ff-button>
        ${readerVisible ? null : html`<ff-button icon="globe" title="Interactive Tours - NOT YET AVAILABLE"
            ?selected=${toursVisible} @click=${this.onToggleTours}></ff-button>
        <ff-button icon="comment" title="Toggle Annotations"
            ?selected=${annotationsVisible} @click=${this.onToggleAnnotations}></ff-button>
        ${showFullscreenButton ? html`<ff-button icon="expand" title="Toggle fullscreen mode"
            ?selected=${fullscreenEnabled} @click=${this.onToggleFullscreen}></ff-button>` : null}
        ${showToolButton ? html`<ff-button icon="tools" title="Tools and Settings"
            ?selected=${toolsVisible} @click=${this.onToggleTools}></ff-button>` : null}`}`;
    }

    protected onReaderVisible(visible: boolean)
    {
        if (visible) {
            this.toolManager.ins.visible.setValue(false);
        }

        this.performUpdate();
    }

    protected onToggleReader()
    {
        const prop = this.reader.ins.visible;
        prop.setValue(!prop.value);
    }

    protected onToggleFullscreen()
    {
        this.interface.toggleFullscreen();
    }

    protected onToggleTours()
    {
        const prop = this.tourPlayer.ins.state;

        if (prop.value !== ETourPlayerState.Off) {
            prop.setValue(ETourPlayerState.Off);
        }
        else {
            prop.setValue(ETourPlayerState.Menu);
        }
    }

    protected onToggleAnnotations()
    {
        const document = this.activeDocument;
        const scene = document ? document.getInnerComponent(CVScene_old) : null;

        if (scene) {
            const prop = scene.ins.annotationsVisible;
            prop.setValue(!prop.value);
        }
    }

    protected onToggleTools()
    {
        const prop = this.toolManager.ins.visible;
        prop.setValue(!prop.value);
    }
}