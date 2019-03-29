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

import CFullscreen from "@ff/scene/components/CFullscreen";

import CVInterface from "../../components/CVInterface";
import CVToolProvider from "../../components/CVToolProvider";
import CVDocument from "../../components/CVDocument";

////////////////////////////////////////////////////////////////////////////////

@customElement("sv-main-menu")
export default class MainMenu extends DocumentView
{
    protected interface: CVInterface = null;

    protected get fullscreen() {
        return this.system.getMainComponent(CFullscreen);
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
        this.fullscreen.outs.fullscreenActive.on("value", this.onUpdate, this);
        this.toolProvider.ins.visible.on("value", this.onUpdate, this);
    }

    protected disconnected()
    {
        this.toolProvider.ins.visible.off("value", this.onUpdate, this);
        this.fullscreen.outs.fullscreenActive.off("value", this.onUpdate, this);
        super.disconnected();
    }

    protected render()
    {
        const scene = this.activeScene;
        if (!scene) {
            console.warn("no scene");
            return html``;
        }

        const fullscreen = this.fullscreen;
        const fullscreenActive = fullscreen.outs.fullscreenActive.value;
        const showFullscreenButton = fullscreen.outs.fullscreenAvailable.value;

        const readerVisible = scene.reader.ins.visible.value;
        const toursVisible = scene.tours.ins.enabled.value;
        const annotationsVisible = scene.viewer.ins.annotationsVisible.value;
        const toolsVisible = this.toolProvider.ins.visible.value;

        const iface = this.interface;
        const showToolButton = iface ? iface.ins.tools.value : false;

        return html`<ff-button icon="document" title="Read more..."
            ?selected=${readerVisible} @click=${this.onToggleReader}></ff-button>
        ${readerVisible ? null : html`<ff-button icon="globe" title="Interactive Tours - NOT YET AVAILABLE"
            ?selected=${toursVisible} @click=${this.onToggleTours}></ff-button>
        <ff-button icon="comment" title="Toggle Annotations"
            ?selected=${annotationsVisible} @click=${this.onToggleAnnotations}></ff-button>
        ${showFullscreenButton ? html`<ff-button icon="expand" title="Toggle fullscreen mode"
            ?selected=${fullscreenActive} @click=${this.onToggleFullscreen}></ff-button>` : null}
        ${showToolButton ? html`<ff-button icon="tools" title="Tools and Settings"
            ?selected=${toolsVisible} @click=${this.onToggleTools}></ff-button>` : null}`}`;
    }

    protected onToggleReader()
    {
        const prop = this.activeScene.reader.ins.visible;
        prop.setValue(!prop.value);
    }

    protected onToggleTours()
    {
        const prop = this.activeScene.tours.ins.enabled;
        prop.setValue(!prop.value);
    }

    protected onToggleAnnotations()
    {
        const prop = this.activeScene.viewer.ins.annotationsVisible;
        prop.setValue(!prop.value);
    }

    protected onToggleFullscreen()
    {
        this.fullscreen.toggle();
    }

    protected onToggleTools()
    {
        const prop = this.toolProvider.ins.visible;
        prop.setValue(!prop.value);
    }

    protected onActiveDocument(previous: CVDocument, next: CVDocument)
    {
        if (previous) {
            const scene = previous.setup;
            scene.interface.off("update", this.onUpdate, this);
            scene.reader.ins.visible.off("value", this.onUpdate, this);
            scene.tours.ins.enabled.off("value", this.onUpdate, this);
            scene.viewer.ins.annotationsVisible.off("value", this.onUpdate, this);
            this.toolProvider.ins.visible.off("value", this.onUpdate, this);
        }
        if (next) {
            const scene = next.setup;
            scene.interface.on("update", this.onUpdate, this);
            scene.reader.ins.visible.on("value", this.onUpdate, this);
            scene.tours.ins.enabled.on("value", this.onUpdate, this);
            scene.viewer.ins.annotationsVisible.on("value", this.onUpdate, this);
            this.toolProvider.ins.visible.on("value", this.onUpdate, this);
        }

        this.interface = next && next.setup.interface;
        this.requestUpdate();
    }
}