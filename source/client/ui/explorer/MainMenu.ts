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

import Subscriber from "@ff/core/Subscriber";
import CFullscreen from "@ff/scene/components/CFullscreen";

import CVAnalytics from "../../components/CVAnalytics";
import CVToolProvider from "../../components/CVToolProvider";
import CVDocument from "../../components/CVDocument";

import DocumentView, { customElement, html } from "./DocumentView";
import ShareMenu from "./ShareMenu";

////////////////////////////////////////////////////////////////////////////////

@customElement("sv-main-menu")
export default class MainMenu extends DocumentView
{
    protected documentProps = new Subscriber("value", this.onUpdate, this);
    protected shareButtonSelected = false;

    protected get fullscreen() {
        return this.system.getMainComponent(CFullscreen);
    }
    protected get toolProvider() {
        return this.system.getMainComponent(CVToolProvider);
    }
    protected get analytics() {
        return this.system.getMainComponent(CVAnalytics);
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

        const setup = document.setup;

        const readerActive = setup.reader.ins.enabled.value;

        const tourButtonVisible = setup.tours.outs.count.value > 0;
        const toursActive = setup.tours.ins.enabled.value;

        const annotationsButtonVisible = true;
        const annotationsActive = setup.viewer.ins.annotationsVisible.value;

        const fullscreen = this.fullscreen;
        const fullscreenButtonVisible = fullscreen.outs.fullscreenAvailable.value;
        const fullscreenActive = fullscreen.outs.fullscreenActive.value;

        const toolButtonVisible = setup.interface.ins.tools.value;
        const toolsActive = this.toolProvider.ins.visible.value;

        return html`<ff-button icon="article" title="Read more..."
            ?selected=${readerActive} @click=${this.onToggleReader}></ff-button>
        ${tourButtonVisible ? html`<ff-button icon="globe" title="Interactive Tours"
            ?selected=${toursActive} @click=${this.onToggleTours}></ff-button>` : null}
        ${annotationsButtonVisible ? html`<ff-button icon="comment" title="Show/Hide Annotations"
            ?selected=${annotationsActive} @click=${this.onToggleAnnotations}></ff-button>` : null}
        <ff-button icon="share" title="Share Experience"
            ?selected=${this.shareButtonSelected} @click=${this.onToggleShare}></ff-button>    
        ${fullscreenButtonVisible ? html`<ff-button icon="expand" title="Fullscreen"
            ?selected=${fullscreenActive} @click=${this.onToggleFullscreen}></ff-button>` : null}
        ${toolButtonVisible ? html`<ff-button icon="tools" title="Tools and Settings"
            ?selected=${toolsActive} @click=${this.onToggleTools}></ff-button>` : null}`;
    }

    protected onToggleReader()
    {
        const prop = this.activeDocument.setup.reader.ins.enabled;
        prop.setValue(!prop.value);
    }

    protected onToggleTours()
    {
        const prop = this.activeDocument.setup.tours.ins.enabled;
        prop.setValue(!prop.value);
    }

    protected onToggleAnnotations()
    {
        const prop = this.activeDocument.setup.viewer.ins.annotationsVisible;
        prop.setValue(!prop.value);
    }

    protected onToggleShare()
    {
        if (!this.shareButtonSelected) {
            this.shareButtonSelected = true;
            this.requestUpdate();

            ShareMenu.show(this).then(() => {
                this.shareButtonSelected = false;
                this.requestUpdate()
            });

            this.analytics.sendProperty("Menu.Share");
        }
    }

    protected onToggleFullscreen()
    {
        this.fullscreen.toggle();
        this.analytics.sendProperty("Menu.Fullscreen");
    }

    protected onToggleTools()
    {
        const prop = this.toolProvider.ins.visible;
        prop.setValue(!prop.value);
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
                setup.tours.outs.count,
                setup.viewer.ins.annotationsVisible,
                this.toolProvider.ins.visible
            );
        }

        this.requestUpdate();
    }
}