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

import "@ff/ui/Button";

import CVDocument from "../../components/CVDocument";
import CVTours from "../../components/CVTours";

import DocumentView, { customElement, html } from "./DocumentView";

////////////////////////////////////////////////////////////////////////////////

@customElement("sv-tour-navigator")
export default class TourNavigator extends DocumentView
{
    protected tours: CVTours;

    protected firstConnected()
    {
        super.firstConnected();
        this.classList.add("sv-tour-navigator");
    }

    protected render()
    {
        const tours = this.tours;
        const activeTour = tours.activeTour;

        let title, info;

        if (tours && activeTour) {
            const stepNumber = tours.outs.stepIndex.value + 1;
            const stepCount = tours.outs.stepCount.value;
            title = stepCount > 0 ? tours.outs.stepTitle.value : tours.outs.tourTitle.value;
            info = stepCount > 0 ? `Step ${stepNumber} of ${stepCount}` : "No tour steps defined";
        }
        else {
            title = "No tour selected";
            info = "---";
        }

        return html`<ff-button icon="bars" ?disabled=${!activeTour} @click=${this.onClickMenu}></ff-button>
            <div class="ff-ellipsis sv-tour-content">
                <div class="ff-ellipsis sv-tour-title">${title}</div>
                <div class="ff-ellipsis sv-tour-info">${info}</div>
            </div>
            <ff-button icon="triangle-left" ?disabled=${!activeTour} @click=${this.onClickPrevious}></ff-button>
            <ff-button icon="triangle-right" ?disabled=${!activeTour} @click=${this.onClickNext}></ff-button>`;
    }

    protected onClickMenu()
    {
        this.tours.ins.tourIndex.setValue(-1);
    }

    protected onClickPrevious()
    {
        this.tours.ins.previous.set();
    }

    protected onClickNext()
    {
        this.tours.ins.next.set();
    }

    protected onActiveDocument(previous: CVDocument, next: CVDocument)
    {
        if (previous) {
            this.tours.outs.tourIndex.off("value", this.onUpdate, this);
            this.tours.outs.stepIndex.off("value", this.onUpdate, this);
        }
        if (next) {
            this.tours = next.setup.tours;
            this.tours.outs.tourIndex.on("value", this.onUpdate, this);
            this.tours.outs.stepIndex.on("value", this.onUpdate, this);
        }

        this.requestUpdate();
    }
}