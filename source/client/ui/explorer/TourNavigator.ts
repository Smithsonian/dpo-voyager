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

import "@ff/ui/Button";

import CVDocument from "../../components/CVDocument";
import CVTours from "../../components/CVTours";

import DocumentView, { customElement, html } from "./DocumentView";
import CVLanguageManager from "client/components/CVLanguageManager";
import {getFocusableElements, focusTrap} from "../../utils/focusHelpers";
import CVInterface, { EUIElements } from "client/components/CVInterface";

////////////////////////////////////////////////////////////////////////////////

@customElement("sv-tour-navigator")
export default class TourNavigator extends DocumentView
{
    protected tours: CVTours;
    protected language: CVLanguageManager;
    protected interface: CVInterface;

    protected needsFocus: boolean = false;
    protected firstRender: boolean = true;
    protected stepTitle: string = "";
    protected titleDiv: HTMLElement;

    protected firstConnected()
    {
        super.firstConnected();

        this.classList.add("sv-bottom-bar-container", "sv-tour-navigator"/*, "sv-transition"*/); // Chrome bug causing issues with transition
        //setTimeout(() => this.classList.remove("sv-transition"), 1);
        //this.addEventListener("transitionend", this.focusActive, { once: true });

        this.needsFocus = true;
    }

    protected render()
    {
        const tours = this.tours;
        const language = this.language;
        const ui = this.interface;
        const activeTour = tours.activeTour;

        let title, info;

        if (tours && activeTour) {
            const stepNumber = tours.outs.stepIndex.value + 1;
            const stepCount = tours.outs.stepCount.value;
            title = stepCount > 0 ? tours.stepTitle : tours.title;
            info = stepCount > 0 ? `${language.getLocalizedString("Step")} ${stepNumber} ${language.getLocalizedString("of")} ${stepCount}` : language.getLocalizedString("No tour steps defined");
        }
        else {
            title = language.getLocalizedString("No tour selected");
            info = "---";
        }
        this.stepTitle = title;

        if(this.firstRender) {
            title = "";
        }

        const exitButton = ui.isShowing(EUIElements.tour_exit) ? html`<ff-button class="sv-section-lead" transparent icon="close" title=${language.getLocalizedString("Exit Tour")} ?disabled=${!activeTour} @click=${this.onClickExit}></ff-button>` : null;

        return html`<div class="sv-blue-bar" role=region title="Tour Navigation" @keydown=${e =>this.onKeyDown(e)}><div class="sv-section">
            ${exitButton}
            <div class="ff-ellipsis sv-content" id="title-area" aria-live="polite" aria-atomic="true" aria-relevant="additions text" @click=${this.onClickTitle}>
                <div class="ff-ellipsis" id="title-text"><div class="ff-ellipsis sv-title" id="title-inner">${title}</div></div>
                <div class="ff-ellipsis sv-text">${info}</div>
            </div>
            <ff-button class="sv-section-trail" transparent icon="bars" title=${language.getLocalizedString("Show Tour Menu")} @click=${this.onClickMenu}></ff-button>
            <ff-button class="sv-section-trail" transparent icon="triangle-left" title=${language.getLocalizedString("Go Backward")} ?disabled=${!activeTour} @click=${this.onClickPrevious}></ff-button>
            <ff-button class="sv-section-trail" transparent icon="triangle-right" title=${language.getLocalizedString("Go Forward")} ?disabled=${!activeTour} @click=${this.onClickNext}></ff-button>
        </div></div>`;
    }

    protected updated(changedProperties) {
        super.updated(changedProperties);

        if(this.needsFocus) {
            const container = this.getElementsByClassName("sv-section-trail").item(2) as HTMLElement;
            container.focus();
            this.needsFocus = false;
        }

        // Hack so that initial nav title display is detected by screen readers.
        const titleDiv = this.getElementsByClassName("sv-title").item(0) as HTMLElement;
        if(titleDiv)
        {
            //titleDiv.innerHTML = this.stepTitle;
            if(this.firstRender) {  
                //setTimeout(() => {titleDiv.innerHTML = `<div class="" id="title-text-alt">${this.stepTitle}</div>`;}, 100);
                setTimeout(() => {titleDiv.innerText = this.stepTitle;}, 100);
                this.firstRender = false;
            }
            else {
                titleDiv.innerText = this.stepTitle;
            }
        }
    }

    protected onClickExit()
    {
        // disable tours
        this.tours.ins.enabled.setValue(false);
        this.tours.ins.closed.set();
    }

    protected onClickMenu()
    {
        // enter tour menu
        this.tours.ins.tourIndex.setValue(-1);
    }

    protected onClickPrevious()
    {
        // go to previous tour step
        this.tours.ins.previous.set();

        // cancel any existing animations
        const titleDiv = this.querySelector("#title-inner") as HTMLElement;
        titleDiv.classList.remove("sv-text-scroll");
    }

    protected onClickNext()
    {
        // go to next tour step
        this.tours.ins.next.set();

        // cancel any existing animations
        const titleDiv = this.querySelector("#title-inner") as HTMLElement;
        titleDiv.classList.remove("sv-text-scroll");
    }

    protected onClickTitle()
    {
        this.textHelper();
    }

    /*protected focusActive()
    {
        const container = this.getElementsByClassName("sv-section-trail").item(2) as HTMLElement;
        container.focus();
    }*/

    protected onActiveDocument(previous: CVDocument, next: CVDocument)
    {
        if (previous) {
            this.tours.outs.tourIndex.off("value", this.onUpdate, this);
            this.tours.outs.stepIndex.off("value", this.onUpdate, this);
            this.language.outs.language.off("value", this.onUpdate, this);
        }
        if (next) {
            this.tours = next.setup.tours;
            this.language = next.setup.language;
            this.interface = next.setup.interface;
            this.tours.outs.tourIndex.on("value", this.onUpdate, this);
            this.tours.outs.stepIndex.on("value", this.onUpdate, this);
            this.language.outs.language.on("value", this.onUpdate, this);
        }

        this.requestUpdate();
    }

    protected onKeyDown(e: KeyboardEvent)
    {
        if (e.code === "Escape") {
            e.preventDefault();
            this.tours.ins.tourIndex.setValue(-1);
            //this.dispatchEvent(new CustomEvent("close"));
        }
        else if(e.code === "Tab") {
            focusTrap(getFocusableElements(this) as HTMLElement[], e);
        }
    }

    protected textHelper() {
        const buffer = 12;
        const titleDiv = this.querySelector("#title-inner") as HTMLElement;
        const offset = titleDiv.scrollWidth - titleDiv.offsetWidth + buffer;

        if(offset > buffer) {
            const titleArea = this.querySelector("#title-area") as HTMLElement;
            const duration = offset/30;

            titleDiv.classList.remove("ff-ellipsis");

            titleDiv.style.setProperty("animation-duration", duration.toString()+"s");
            titleDiv.style.setProperty("--x-offset", "-" + offset + "px");
            titleArea.style.setProperty("pointer-events", "none");
            titleDiv.classList.add("sv-text-scroll");
            
            titleDiv.addEventListener("animationend",() => {
                titleDiv.classList.remove("sv-text-scroll");
                titleDiv.classList.add("ff-ellipsis");
                titleArea.style.setProperty("pointer-events", "auto");
            });

            titleDiv.addEventListener("animationcancel",() => {
                titleDiv.classList.remove("sv-text-scroll");
                titleDiv.classList.add("ff-ellipsis");
                titleArea.style.setProperty("pointer-events", "auto");
            });
        }
    }
}