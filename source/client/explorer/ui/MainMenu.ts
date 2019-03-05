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

import SystemElement, { customElement, html } from "../../core/ui/SystemElement";

import CVInterface from "../components/CVInterface";
import CVReader from "../components/CVReader";
import CVTourPlayer, { ETourPlayerState } from "../components/CVTourPlayer";
import CVTools from "../components/CVTools";
import CDocumentManager from "@ff/graph/components/CDocumentManager";

////////////////////////////////////////////////////////////////////////////////

@customElement("sv-main-menu")
export default class MainMenu extends SystemElement
{
    protected get documentManager() {
        return this.system.getMainComponent(CDocumentManager);
    }
    protected get interface() {
        return this.system.getMainComponent(CVInterface);
    }
    protected get reader() {
        return this.system.getMainComponent(CVReader);
    }
    protected get tourPlayer() {
        return this.system.getMainComponent(CVTourPlayer);
    }
    protected get tools() {
        return this.system.getMainComponent(CVTools);
    }

    protected firstConnected()
    {
        this.classList.add("sv-main-menu");
    }

    protected connected()
    {
        this.interface.on("update", this.performUpdate, this);
        this.interface.outs.fullscreenEnabled.on("value", this.performUpdate, this);
        this.reader.ins.visible.on("value", this.onReaderVisible, this);
        this.tourPlayer.ins.state.on("value", this.performUpdate, this);
        this.tools.ins.visible.on("value", this.performUpdate, this);
    }

    protected disconnected()
    {
        this.interface.off("update", this.performUpdate, this);
        this.interface.outs.fullscreenEnabled.off("value", this.performUpdate, this);
        this.reader.ins.visible.off("value", this.onReaderVisible, this);
        this.tourPlayer.ins.state.off("value", this.performUpdate, this);
        this.tools.ins.visible.off("value", this.performUpdate, this);
    }

    protected render()
    {
        const readerVisible = this.reader.ins.visible.value;
        const toursVisible = this.tourPlayer.ins.state.value !== ETourPlayerState.Off;
        const annotationsVisible = false;
        const toolsVisible = this.tools.ins.visible.value;

        const _interface = this.interface;
        const fullscreenEnabled = _interface.outs.fullscreenEnabled.value;
        const showFullscreenButton = _interface.outs.fullscreenAvailable.value;
        const showToolButton = _interface.ins.tools.value;

        return html`<ff-button icon="information" title="Read more..."
            ?selected=${readerVisible} @click=${this.onToggleReader}></ff-button>
        ${readerVisible ? null : html`${showFullscreenButton ? html`<ff-button icon="expand" title="Toggle fullscreen mode"
            ?selected=${fullscreenEnabled} @click=${this.onToggleFullscreen}></ff-button>` : null}
        <ff-button icon="globe" title="Interactive Tours"
            ?selected=${toursVisible} @click=${this.onToggleTours}></ff-button>
        <ff-button icon="comment" title="Toggle Annotations"
            ?selected=${annotationsVisible} @click=${this.onToggleAnnotations}></ff-button>
        ${showToolButton ? html`<ff-button icon="tools" title="Tools and Settings"
            ?selected=${toolsVisible} @click=${this.onToggleTools}></ff-button>` : null}`}`;
    }

    protected onReaderVisible(visible: boolean)
    {
        if (visible) {
            this.tools.ins.visible.setValue(false);
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

    }

    protected onToggleTools()
    {
        const prop = this.tools.ins.visible;
        prop.setValue(!prop.value);
    }
}