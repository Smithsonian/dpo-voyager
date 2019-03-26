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

import DocumentView, { customElement, html } from "./DocumentView";

import CVTours from "../components/CVTours";

////////////////////////////////////////////////////////////////////////////////

console.log("LOAD");

@customElement("sv-tour-navigator")
export default class TourNavigator extends DocumentView
{
    protected get tours() {
        const document = this.activeDocument;
        return document ? document.getInnerComponent(CVTours) : null;
    }

    protected firstConnected()
    {
        console.log("FIRST CONNECTED");
        super.firstConnected();
        this.classList.add("sv-tour-navigator");
    }

    protected render()
    {
        console.log("RENDER");

        const tours = this.tours;
        const activeTour = tours.activeTour;

        let title, info;

        if (activeTour) {
            title = activeTour.data.title;
            info = "Step 1 of 10";
        }
        else {
            title = "No tour selected";
            info = "---";
        }

        return html`<ff-button icon="bars" ?disabled=${!activeTour} @click=${this.onClickMenu}></ff-button>
            <div class="ff-flex-column">
                <div class="sv-tour-title ff-ellipsis">${title}</div>
                <div class="sv-tour-info ff-ellipsis">${info}</div>
            </div>
            <ff-button icon="triangle-left" ?disabled=${!activeTour} @click=${this.onClickPrevious}></ff-button>
            <ff-button icon="triangle-right" ?disabled=${!activeTour} @click=${this.onClickNext}></ff-button>`;
    }

    protected onClickMenu()
    {

    }

    protected onClickPrevious()
    {

    }

    protected onClickNext()
    {

    }
}