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
import CVARManager from "../../components/CVARManager";
import CVScene from "../../components/CVScene";
import CVModel2 from "../../components/CVModel2";
import { EDerivativeQuality } from "../../schema/model";

import DocumentView, { customElement, html } from "./DocumentView";
import ShareMenu from "./ShareMenu";
import CVAnnotationView from "client/components/CVAnnotationView";

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
    protected get arManager() {
        return this.system.getMainComponent(CVARManager);
    }
    protected get sceneNode() {
        return this.system.getComponent(CVScene);
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
        this.activeDocument.setup.language.outs.language.on("value", this.onUpdate, this);
    }

    protected disconnected()
    {
        this.activeDocument.setup.language.outs.language.off("value", this.onUpdate, this);
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

        const isEditing = !!this.system.getComponent("CVStoryApplication", true);

        const setup = document.setup;
        const scene = this.sceneNode;

        const tourButtonVisible = setup.tours.outs.count.value > 0;
        const toursActive = setup.tours.ins.enabled.value;

        const modeButtonsDisabled = toursActive && !isEditing;

        const readerButtonVisible = setup.reader.articles.length > 0; // && !isEditing;
        const readerActive = setup.reader.ins.enabled.value;

        const views = scene.getGraphComponents(CVAnnotationView);
        const annotationsButtonVisible = views.some(view => {return view.hasAnnotations;}); //true;
        const annotationsActive = setup.viewer.ins.annotationsVisible.value;

        const fullscreen = this.fullscreen;
        const fullscreenButtonVisible = fullscreen.outs.fullscreenAvailable.value;
        const fullscreenActive = fullscreen.outs.fullscreenActive.value;

        const toolButtonVisible = setup.interface.ins.tools.value;
        const toolsActive = this.toolProvider.ins.visible.value;

        const language = setup.language;

        // TODO - push to ARManager?
        const models = scene.getGraphComponents(CVModel2);
        const ARderivatives = models[0] ? models[0].derivatives.getByQuality(EDerivativeQuality.AR) : [];
        const arButtonVisible = this.arManager.outs.available.value && ARderivatives.length > 0 && models.length >= 1;

        return html`${arButtonVisible ? html`<ff-button role="button" icon="ar" title=${language.getLocalizedString("Enter AR View")}
            @click=${this.onEnterAR}></ff-button>` : null}
        ${tourButtonVisible ? html`<ff-button role="button" aria-pressed=${toursActive} icon="globe" title=${language.getLocalizedString("Interactive Tours")}
            ?selected=${toursActive} @click=${this.onToggleTours}></ff-button>` : null}
        ${readerButtonVisible ? html`<ff-button role="button" aria-pressed=${readerActive} icon="article" title=${language.getLocalizedString("Read more...")}
            ?selected=${readerActive} ?disabled=${modeButtonsDisabled} @click=${this.onToggleReader}></ff-button>` : null}
        ${annotationsButtonVisible ? html`<ff-button role="button" aria-pressed=${annotationsActive} icon="comment" title=${language.getLocalizedString("Show/Hide Annotations")}
            ?selected=${annotationsActive} ?disabled=${modeButtonsDisabled} @click=${this.onToggleAnnotations}></ff-button>` : null}
        <ff-button icon="share" role="button" aria-pressed=${this.shareButtonSelected} title=${language.getLocalizedString("Share Experience")}
            ?selected=${this.shareButtonSelected} @click=${this.onToggleShare}></ff-button>    
        ${fullscreenButtonVisible ? html`<ff-button role="button" aria-pressed=${fullscreenActive} icon="expand" title=${language.getLocalizedString("Fullscreen")}
            ?selected=${fullscreenActive} @click=${this.onToggleFullscreen}></ff-button>` : null}
        ${toolButtonVisible ? html`<ff-button role="button" aria-pressed=${toolsActive} icon="tools" title=${language.getLocalizedString("Tools and Settings")}
            ?selected=${toolsActive} ?disabled=${modeButtonsDisabled} @click=${this.onToggleTools}></ff-button>` : null}`;
    }

    protected onToggleReader()
    {
        const readerIns = this.activeDocument.setup.reader.ins;
        readerIns.enabled.setValue(!readerIns.enabled.value);

        this.analytics.sendProperty("Reader.Enabled", readerIns.enabled.value);
    }

    protected onToggleTours()
    {
        const tourIns = this.activeDocument.setup.tours.ins;
        const readerIns = this.activeDocument.setup.reader.ins;

        if (tourIns.enabled.value) {
            tourIns.enabled.setValue(false);
        }
        else {
            if (readerIns.enabled.value) {
                readerIns.enabled.setValue(false); // disable reader
            }

            tourIns.enabled.setValue(true); // enable tours
            tourIns.tourIndex.setValue(-1); // show tour menu
        }

        this.analytics.sendProperty("Tours.Enabled", tourIns.enabled.value);
    }

    protected onToggleAnnotations()
    {
        const toolIns = this.toolProvider.ins;
        const viewerIns = this.activeDocument.setup.viewer.ins;

        if (toolIns.visible.value) {
            toolIns.visible.setValue(false);
        }

        viewerIns.annotationsVisible.setValue(!viewerIns.annotationsVisible.value);
        this.analytics.sendProperty("Annotations.Visible", viewerIns.annotationsVisible.value);
    }

    protected onToggleShare()
    {
        if (!this.shareButtonSelected) {
            this.shareButtonSelected = true;
            this.requestUpdate();

            ShareMenu.show(this, this.activeDocument.setup.language).then(() => {
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
        const toolIns = this.toolProvider.ins;
        const viewerIns = this.activeDocument.setup.viewer.ins;

        if (viewerIns.annotationsVisible.value) {
            viewerIns.annotationsVisible.setValue(false);
        }

        toolIns.visible.setValue(!toolIns.visible.value);
        this.analytics.sendProperty("Tools.Visible", toolIns.visible.value);
    }

    protected onEnterAR()
    {
        const arIns = this.arManager.ins;
        arIns.enabled.setValue(true);
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