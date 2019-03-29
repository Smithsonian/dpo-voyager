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


import List from "@ff/ui/List";

import CVTours, { Tour } from "../../components/CVTours";
import CVToursTask from "../../components/CVToursTask";
import { TaskView, customElement, property, html } from "../../components/CVTask";
import CVSetup from "../../components/CVSetup";

////////////////////////////////////////////////////////////////////////////////

@customElement("sv-tours-task-view")
export default class ToursTaskView extends TaskView<CVToursTask>
{
    protected activeTour: Tour = null;

    protected render()
    {
        const setup = this.activeSetup;

        if (!setup) {
            return html`<div class="sv-placeholder">Please select a presentation to edit its tours.</div>`;
        }

        const tours = setup.tours.tours;
        const activeTour = this.activeTour;

        return html`<div class="sv-commands">
            <ff-button text="Create" icon="create" @click=${this.onClickCreate}></ff-button>
            <ff-button text="Move Up" icon="up" ?disabled=${!activeTour} @click=${this.onClickUp}></ff-button>
            <ff-button text="Move Down" icon="down" ?disabled=${!activeTour} @click=${this.onClickDown}></ff-button>
            <ff-button text="Delete" icon="trash" ?disabled=${!activeTour} @click=${this.onClickDelete}></ff-button>
        </div>
        <div class="ff-flex-item-stretch">
            <div class="ff-flex-column ff-fullsize">
                <sv-tour-list .data=${tours} .selectedItem=${activeTour} @select=${this.onSelectTour}></sv-tour-list>
            </div>
        </div>`;
    }

    protected onClickCreate()
    {
        this.task.createTour();
    }

    protected onClickDelete()
    {
        this.task.deleteTour();
    }

    protected onClickUp()
    {
        this.task.moveTourUp();
    }

    protected onClickDown()
    {
        this.task.moveTourDown();
    }

    protected onSelectTour(event: ISelectTourEvent)
    {
        this.activeDocument.setup.tours.activeTour = event.detail.tour;
    }

    protected onActiveSetup(previous: CVSetup, next: CVSetup)
    {
        if (previous) {
            previous.tours.outs.activeTour.off("value", this.onActiveTour, this);
        }
        if (next) {
            next.tours.outs.activeTour.on("value", this.onActiveTour, this);

        }
    }

    protected onActiveTour(tour: Tour)
    {
        this.activeTour = tour;
        this.requestUpdate();
    }
}

interface ISelectTourEvent extends CustomEvent
{
    target: TourList;
    detail: {
        tour: Tour;
    }
}

@customElement("sv-tour-list")
export class TourList extends List<Tour>
{
    @property({ attribute: false })
    selectedItem: Tour = null;

    protected firstConnected()
    {
        super.firstConnected();
        this.classList.add("sv-tour-list");
    }

    protected renderItem(item: Tour)
    {
        return item.data.title;
    }

    protected isItemSelected(item: Tour)
    {
        return item === this.selectedItem;
    }

    protected onClickItem(event: MouseEvent, item: Tour)
    {
        this.dispatchEvent(new CustomEvent("select", {
            detail: { tour: item }
        }));
    }

    protected onClickEmpty(event: MouseEvent)
    {
        this.dispatchEvent(new CustomEvent("select", {
            detail: { tour: null }
        }));
    }
}