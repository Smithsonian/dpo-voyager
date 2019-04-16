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

import Subscriber from "@ff/core/Subscriber";
import CFullscreen from "@ff/scene/components/CFullscreen";

import CVToolProvider from "../../components/CVToolProvider";
import CVDocument from "../../components/CVDocument";

import DocumentView, { customElement, html } from "./DocumentView";

////////////////////////////////////////////////////////////////////////////////

@customElement("sv-main-menu")
export default class MainMenu extends DocumentView
{
    protected documentProps = new Subscriber("value", this.onUpdate, this);

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
        const document = this.activeDocument;
        if (!document) {
            return html``;
        }

        const fullscreen = this.fullscreen;
        const fullscreenActive = fullscreen.outs.fullscreenActive.value;
        const showFullscreenButton = fullscreen.outs.fullscreenAvailable.value;

        const setup = document.setup;
        const readerVisible = setup.reader.ins.enabled.value;
        const toursVisible = setup.tours.ins.enabled.value;
        const annotationsVisible = setup.viewer.ins.annotationsVisible.value;
        const toolsVisible = this.toolProvider.ins.visible.value;
        const showToolButton = setup.interface.ins.tools.value;

        return html`<ff-button icon="document" title="Read more..."
            ?selected=${readerVisible} @click=${this.onToggleReader}></ff-button>
        <ff-button icon="globe" title="Interactive Tours"
            ?selected=${toursVisible} @click=${this.onToggleTours}></ff-button>
        <ff-button icon="comment" title="Toggle Annotations"
            ?selected=${annotationsVisible} @click=${this.onToggleAnnotations}></ff-button>
        ${showFullscreenButton ? html`<ff-button icon="expand" title="Toggle fullscreen mode"
            ?selected=${fullscreenActive} @click=${this.onToggleFullscreen}></ff-button>` : null}
        ${showToolButton ? html`<ff-button icon="tools" title="Tools and Settings"
            ?selected=${toolsVisible} @click=${this.onToggleTools}></ff-button>` : null}`;
    }

    protected onToggleReader()
    {
        const prop = this.activeDocument.setup.reader.ins.enabled;
        prop.setValue(!prop.value);
    }

    protected onToggleTours()
    {
        const toursProp = this.activeDocument.setup.tours.ins.enabled;
        toursProp.setValue(!toursProp.value);
    }

    protected onToggleAnnotations()
    {
        const prop = this.activeDocument.setup.viewer.ins.annotationsVisible;
        prop.setValue(!prop.value);
    }

    protected onToggleFullscreen()
    {
        this.fullscreen.toggle();
    }

    protected onToggleTools()
    {
        const toolsProp = this.toolProvider.ins.visible;
        toolsProp.setValue(!toolsProp.value);
    }

    protected onActiveDocument(previous: CVDocument, next: CVDocument)
    {
        if (previous) {
            this.documentProps.off();
        }
        if (next) {
            const setup = next.setup;

            this.documentProps.on(
                setup.interface.ins.tools,
                setup.reader.ins.enabled,
                setup.tours.ins.enabled,
                setup.viewer.ins.annotationsVisible,
                this.toolProvider.ins.visible
            );
        }

        this.requestUpdate();
    }
}