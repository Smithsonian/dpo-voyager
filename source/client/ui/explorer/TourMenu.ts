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

    constructor()
    {
        super();
    }

    protected firstConnected()
    {
        super.firstConnected();
        this.classList.add("sv-document-overlay", "sv-tour-menu");
    }

    protected connected()
    {
        super.connected();
    }

    protected disconnected()
    {
        super.disconnected();
    }

    protected renderTour(tour: ITour, index: number)
    {
        return html`<div class="sv-tour-menu-entry" @click=${e => this.onClick(e, index)}>
            <div class="sv-tour-menu-title">${tour.title}</div>
            <div class="sv-tour-menu-lead">${tour.lead}</div>
        </div>`;
    }

    protected render()
    {
        return html`<div class="ff-scroll-y">
            ${this.tours.map((tour, index) => this.renderTour(tour, index))}
        </div>`;
    }

    protected onClick(e: MouseEvent, index: number)
    {
        e.stopPropagation();

        this.dispatchEvent(new CustomEvent("select", {
            detail: { index }
        }));
    }
}