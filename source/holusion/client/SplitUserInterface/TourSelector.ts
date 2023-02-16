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

import { ITour } from "client/schema/setup";
import "./TourNavigator"
import { ELanguageType } from "client/schema/common";

////////////////////////////////////////////////////////////////////////////////

export interface ITourMenuSelectEvent extends CustomEvent
{
    detail: {
        index: number;
    }
}

@customElement("tour-selector")
export default class TourSelector extends CustomElement
{
    @property({ attribute: false })
    tours: ITour[];

    @property({ attribute: false })
    activeLanguage: ELanguageType;

    protected firstConnected()
    {
        super.firstConnected();
        this.classList.add("tour-selector");
    }

    
    protected renderEntry(tour: ITour, index: number)
    {
        return html`<div class="tour-entry" @click=${e => this.onClickTour(e, index)}>
            <h1>${Object.keys(tour.titles).length > 0 ? tour.titles[ELanguageType[this.activeLanguage]] : tour.title}</h1>
            <p>${Object.keys(tour.titles).length > 0 ? tour.titles[ELanguageType[this.activeLanguage]] : tour.title}</p>
            <p style="text-align: right; font-weight:600;">Commencer la visite &#129046;</p>
        </div>`;
    }

    protected render()
    {
        
        if (!this.tours||this.tours.length === 0) {
            return html`<div class="lds-ripple">
                <div></div>
                <div></div>
            </div>`;
        }
        return html`${this.tours.map((tour, index) => this.renderEntry(tour, index))}`;

        
    }

    protected onClickTour(e: MouseEvent, index: number)
    {
        e.stopPropagation();
        this.dispatchEvent(new CustomEvent("select", {
            detail: { index }
        }));
    }
}