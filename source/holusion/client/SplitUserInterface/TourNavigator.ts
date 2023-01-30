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

import "@ff/ui/Button";

import CVDocument from "client/components/CVDocument";
import CVTours from "client/components/CVTours";

import DocumentView, { customElement, html } from "client/ui/explorer/DocumentView";
import CVLanguageManager from "client/components/CVLanguageManager";
import CVReader from "client/components/CVReader";
import { unsafeHTML } from "lit-html/directives/unsafe-html";

////////////////////////////////////////////////////////////////////////////////

@customElement("tour-navigator")
export default class TourNavigator extends DocumentView
{
    protected tours: CVTours;
    protected reader: CVReader;

    protected language: CVLanguageManager;

    protected transition=false;

    protected firstConnected()
    {
        super.firstConnected();

        this.classList.add("tour-navigator");

    }

    protected render()
    {
        const tours = this.tours;
        const language = this.language;
        const activeTour = tours.activeTour;

        let title, info;

        let hasNext=true;
        let isNotFirst=true;
        if (tours && activeTour) {
            const stepNumber = tours.outs.stepIndex.value + 1;
            const stepCount = tours.outs.stepCount.value;
            title = stepCount > 0 ? tours.stepTitle : tours.title;
            info = stepCount > 0 ? `${language.getLocalizedString("Step")} ${stepNumber} ${language.getLocalizedString("of")} ${stepCount}` : language.getLocalizedString("No tour steps defined");

            if(stepNumber==1) isNotFirst=false
            if(stepNumber==stepCount) hasNext=false
            if(stepNumber>stepCount) this.dispatchEvent(new CustomEvent("endtour"));
        }
        else {
            title = language.getLocalizedString("No tour selected");
            info = "---";
        }

        let articleContent=this.transition?"":this.reader.outs.content.value || "";


        return html`
            <button class="tour-return" title=${language.getLocalizedString("Exit Tour")} @click=${this.onClickExit}><img src="/back.png">${this.language.getLocalizedString("Return")}</button>
            <div class="et-tour-info">    
                <div class="et-title">${title}</div>
                <div class="et-tour-article et-is-scrollable">${unsafeHTML(articleContent)}</div>
                <div class="et-fade-scroll"></div>
            </div>
            <div class="et-tour-stepper">
                ${isNotFirst?html`<button class="nav-button" title=${language.getLocalizedString("Go Backward")} ?disabled=${!activeTour} @click=${this.onClickPrevious}>
                   ${language.getLocalizedString("Previous")}
                </button>`:null}
                <div class="et-step-count">${info}</div>
                ${hasNext?html`<button class="nav-button et-inverted-btn" title=${language.getLocalizedString("Go Forward")} ?disabled=${!activeTour} @click=${this.onClickNext}>
                    ${language.getLocalizedString("Next")}
                </button>`:null}
            </div>`;
    }

    protected onClickExit()
    {
        console.log("Close tour");
        this.tours.ins.tourIndex.setValue(-1);
        this.tours.ins.first.set()
        this.dispatchEvent(new CustomEvent("close", {}));
    }

    protected onClickPrevious()
    {
        // go to previous tour step
        this.tours.ins.previous.set();
        this.transition=true;
        this.requestUpdate();
    }

    protected onClickNext()
    {
        // go to next tour step
        this.tours.ins.next.set();
        this.transition=true;
        this.requestUpdate();
    }

    protected onActiveDocument(previous: CVDocument, next: CVDocument)
    {
        if (previous) {
            this.tours.outs.tourIndex.off("value", this.onUpdate, this);
            this.tours.outs.stepIndex.off("value", this.stepChanged, this);
            this.language.outs.language.off("value", this.onUpdate, this);
            this.reader.ins.enabled.off("value",this.update,this);
            this.reader.outs.content.off("value",this.readerUpdated,this)
        }
        if (next) {
            this.tours = next.setup.tours;
            this.reader = next.setup.reader;
            this.language = next.setup.language;
            this.tours.outs.tourIndex.on("value", this.onUpdate, this);
            this.tours.outs.stepIndex.on("value", this.stepChanged, this);
            this.language.outs.language.on("value", this.onUpdate, this);

            this.reader.ins.enabled.on("value",this.update,this);
            this.reader.outs.content.on("value",this.readerUpdated,this)
        }

        this.requestUpdate();
    }

    stepChanged(event)
    {
        //this.transition=false;
        this.requestUpdate()

    }
    readerUpdated()
    {
        this.transition=false;
        this.requestUpdate()
    }


}