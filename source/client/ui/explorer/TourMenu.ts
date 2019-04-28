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

import CustomElement, { customElement, property, html } from "@ff/ui/CustomElement";
import "@ff/ui/Button";

import { ITour } from "common/types/setup";


////////////////////////////////////////////////////////////////////////////////

export interface ITourMenuSelectEvent extends CustomEvent
{
    detail: {
        index: number;
    }
}

@customElement("sv-tour-menu")
export default class TourMenu extends CustomElement
{
    @property({ attribute: false })
    tours: ITour[];

    protected firstConnected()
    {
        super.firstConnected();
        this.classList.add("sv-document-overlay", "sv-article", "sv-tour-menu");
    }

    protected renderEntry(tour: ITour, index: number)
    {
        return html`<div class="sv-entry" @click=${e => this.onClickTour(e, index)}>
            <h1>${tour.title}</h1>
            <p>${tour.lead}</p>
        </div>`;
    }

    protected render()
    {
        const tours = this.tours;

        if (tours.length === 0) {
            return html`<div class="sv-entry">
                <h1>No tours available.</h1>
            </div>`;
        }

        return html`<div class="ff-scroll-y">
            ${tours.map((tour, index) => this.renderEntry(tour, index))}
        </div>`;
    }

    protected onClickTour(e: MouseEvent, index: number)
    {
        e.stopPropagation();

        this.dispatchEvent(new CustomEvent("select", {
            detail: { index }
        }));
    }
}