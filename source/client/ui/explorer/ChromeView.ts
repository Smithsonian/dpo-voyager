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

import "@ff/ui/ButtonGroup";

import CVToolProvider from "../../components/CVToolProvider";
import CVDocument from "../../components/CVDocument";

import "../Logo";
import "./MainMenu";
import "./ToolBar";
import "./TourNavigator";
import "./TourMenu";
import "./LanguageMenu";
import "./TagCloud";
import { ITourMenuSelectEvent } from "./TourMenu";

import DocumentView, { customElement, html } from "./DocumentView";
import LanguageMenu from "./LanguageMenu";
import { EUIElements } from "client/components/CVInterface";

////////////////////////////////////////////////////////////////////////////////

@customElement("sv-chrome-view")
export default class ChromeView extends DocumentView
{
    protected documentProps = new Subscriber("value", this.onUpdate, this);
    protected titleElement: HTMLDivElement;

    protected get toolProvider() {
        return this.system.getMainComponent(CVToolProvider);
    }

    protected firstConnected()
    {
        this.style.pointerEvents = "none";
        this.setAttribute("pointer-events", "none");

        this.classList.add("sv-chrome-view");
    }

    protected connected()
    {
        super.connected();
        this.toolProvider.ins.visible.on("value", this.onUpdate, this);
        this.activeDocument.setup.language.outs.language.on("value", this.onUpdate, this);
        this.titleElement = this.createElement("div", null);
        this.titleElement.classList.add("ff-ellipsis");
    }

    protected disconnected()
    {
        this.activeDocument.setup.language.outs.language.off("value", this.onUpdate, this);
        this.toolProvider.ins.visible.off("value", this.onUpdate, this);
        super.disconnected();
    }

    protected render()
    {
        const document = this.activeDocument;
        const titleElement = this.titleElement;

        if (!document) {
            return html``;
        }

        const setup = document.setup;

        const interfaceVisible = setup.interface.ins.visible.value;
        const logoVisible = setup.interface.ins.logo.value && setup.interface.isShowing(EUIElements.logo);
        const menuVisible = setup.interface.ins.menu.value && setup.interface.isShowing(EUIElements.menu);
        const titleVisible = setup.interface.ins.visibleElements.value && setup.interface.isShowing(EUIElements.title);

        const readerVisible = setup.reader.ins.enabled.value;

        const tours = setup.tours.tours;
        const toursEnabled = setup.tours.ins.enabled.value;
        const tourActive = setup.tours.outs.tourIndex.value >= 0;

        const language = setup.language;
        const languages = language.activeLanguages;
        const activeLanguage = language.outs.language.value;
        const languagesVisible = languages.length > 1 && setup.interface.isShowing(EUIElements.language);

        const isEditing = !!this.system.getComponent("CVStoryApplication", true);
        const toolBarAllowed = isEditing || !toursEnabled;

        // tag cloud is visible if annotations are enabled and there is at least one tag in the cloud
        const tagCloudVisible = setup.viewer.ins.annotationsVisible.value && setup.viewer.outs.tagCloud.value;
        const toolsVisible = !readerVisible && this.toolProvider.ins.visible.value;

        const showTourEndMsg = this.activeDocument.setup.tours.outs.ending.value;
        this.activeDocument.setup.tours.outs.ending.setValue(false);

        if (!interfaceVisible) {
            return html``;
        }

        let title;

        if (toursEnabled) {
            if (!tourActive) {
                title = language.getLocalizedString("Interactive Tours");
            }
            else {
                title = language.getLocalizedString("Tour") + ": " + setup.tours.outs.tourTitle.value;
            }
        }
        else {
            title = document.outs.title.value || "Missing Title" || document.name;
        }

        titleElement.innerHTML = title;

        return html`${showTourEndMsg ? html`<div class="sr-only" role="alert" id="screen-reader-msg">Tour Ending...</div>` : null}
            <div class="sv-chrome-header">
                <div class="sv-main-menu-wrapper">
                    ${menuVisible ? html`<sv-main-menu role="region" aria-label="Main toolbar" .system=${this.system}></sv-main-menu>` : null}
                </div>
                <div class="sv-top-bar">
                    ${titleVisible ? html`<div role="heading" class="ff-ellipsis sv-main-title">${titleElement}<span class="ff-ellipsis"> </span></div>` : null}
                    ${logoVisible ? html`<sv-logo></sv-logo>` : null}
                </div>
            </div>
            <div class="ff-flex-spacer"></div>
            ${toursEnabled && tourActive ? html`<sv-tour-navigator @close=${this.closeTours} .system=${this.system}></sv-tour-navigator>` : null}
            ${toursEnabled && !tourActive ? html`<sv-tour-menu .tours=${tours} .activeLanguage=${activeLanguage} @close=${this.closeTours} @select=${this.onSelectTour}></sv-tour-menu>` : null}
            ${tagCloudVisible && toolBarAllowed ? html`<sv-tag-cloud .system=${this.system}></sv-tag-cloud>` : null}
            ${toolsVisible && toolBarAllowed ? html`<div class="sv-tool-bar-container"><sv-tool-bar .system=${this.system} @close=${this.closeTools}></sv-tool-bar></div>` : null}
            <div class="sv-chrome-footer">
                <div class="sv-bottom-bar">
                    ${languagesVisible ? html`<ff-button id="language" text=${setup.language.toString()} title=${language.getLocalizedString("Set Language")} class="ff-ellipsis sv-language-display" @click=${this.openLanguageMenu}></ff-button>` : null}
                </div>
            </div>`;
    }

    protected onSelectTour(event: ITourMenuSelectEvent)
    {
        const tours = this.activeDocument.setup.tours;
        tours.ins.tourIndex.setValue(event.detail.index);
    }

    protected closeTours()
    {
        const tours = this.activeDocument.setup.tours;
        tours.ins.enabled.setValue(false);
        tours.ins.closed.set();
    }

    protected openLanguageMenu() {
        const language = this.activeDocument.setup.language;

        if (!language.ins.enabled.value) {
            language.ins.enabled.setValue(true);

            LanguageMenu.show(this, this.activeDocument.setup.language).then(() => {
                language.ins.enabled.setValue(false);
                (this.getElementsByClassName("sv-language-display")[0] as HTMLElement).focus();
            });
        }
    }

    protected closeTools()
    {
        const toolIns = this.toolProvider.ins;
        toolIns.visible.setValue(false);
        toolIns.closed.set();
    }

    protected onActiveDocument(previous: CVDocument, next: CVDocument)
    {
        if (previous) {
            this.documentProps.off();
        }
        if (next) {
            const setup = next.setup;
            this.documentProps.on(
                next.outs.title,
                next.outs.assetPath,
                setup.interface.ins.visible,
                setup.interface.ins.logo,
                setup.interface.ins.menu,
                setup.viewer.ins.annotationsVisible,
                setup.reader.ins.enabled,
                setup.tours.ins.enabled,
                setup.tours.outs.tourIndex,
            );
        }

        this.requestUpdate();
    }
}