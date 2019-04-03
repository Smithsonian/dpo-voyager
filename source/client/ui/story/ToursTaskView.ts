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

import { ITour } from "common/types/setup";

import CVToursTask from "../../components/CVToursTask";
import { TaskView, customElement, property, html } from "../../components/CVTask";
import { ILineEditChangeEvent } from "@ff/ui/LineEdit";
import CVDocument from "../../components/CVDocument";

////////////////////////////////////////////////////////////////////////////////

@customElement("sv-tours-task-view")
export default class ToursTaskView extends TaskView<CVToursTask>
{
    protected render()
    {
        console.log("TourTaskView.render");

        const task = this.task;
        const tours = task.tours;

        if (!tours) {
            return html`<div class="sv-placeholder">Please select a document to edit its tours.</div>`;
        }
        if (!tours.ins.enabled.value) {
            return html`<div class="sv-placeholder">Please activate the tour button in the main menu.</div>`;
        }

        const tourList = tours.tours;
        const activeTour = tours.activeTour;

        const detailView = activeTour ? html`<div class="ff-scroll-y ff-flex-column sv-detail-view">
            <div class="sv-label">Title</div>
            <ff-line-edit name="title" text=${task.ins.tourTitle.value} @change=${this.onTextEdit}></ff-line-edit>
            <div class="sv-label">Tags</div>
            <ff-line-edit name="tags" text=${task.ins.tourTags.value} @change=${this.onTextEdit}></ff-line-edit>
            <div class="sv-label">Lead</div>
            <ff-text-edit name="lead" text=${task.ins.tourLead.value} @change=${this.onTextEdit}></ff-text-edit>
        </div>` : null;

        return html`<div class="sv-commands">
            <ff-button title="Create Tour" icon="create" @click=${this.onClickCreate}></ff-button>
            <ff-button title="Move Tour Up" icon="up" ?disabled=${!activeTour} @click=${this.onClickUp}></ff-button>
            <ff-button title="Move Tour Down" icon="down" ?disabled=${!activeTour} @click=${this.onClickDown}></ff-button>
            <ff-button title="Delete Tour" icon="trash" ?disabled=${!activeTour} @click=${this.onClickDelete}></ff-button>
            <ff-button title="Snapshot Configuration" icon="bars" @click=${this.onClickConfig}></ff-button>
        </div>
        <div class="ff-flex-item-stretch">
            <div class="ff-flex-column ff-fullsize">
                <div class="ff-splitter-section" style="flex-basis: 30%">
                    <div class="ff-scroll-y ff-flex-column">
                        <sv-tour-list .data=${tourList.slice()} .selectedItem=${activeTour} @select=${this.onSelectTour}></sv-tour-list>
                    </div>
                </div>
                <ff-splitter direction="vertical"></ff-splitter>
                <div class="ff-splitter-section" style="flex-basis: 70%">
                    ${detailView}
                </div>
            </div>
        </div>`;
    }

    protected onClickCreate()
    {
        this.task.ins.createTour.set();
    }

    protected onClickDelete()
    {
        this.task.ins.deleteTour.set();
    }

    protected onClickUp()
    {
        this.task.ins.moveTourUp.set();
    }

    protected onClickDown()
    {
        this.task.ins.moveTourDown.set();
    }

    protected onClickConfig()
    {

    }

    protected onSelectTour(event: ISelectTourEvent)
    {
        this.task.tours.ins.tourIndex.setValue(event.detail.index);
    }

    protected onTextEdit(event: ILineEditChangeEvent)
    {
        const task = this.task;
        const target = event.target;
        const text = event.detail.text;

        if (target.name === "title") {
            task.ins.tourTitle.setValue(text);
        }
        else if (target.name === "lead") {
            task.ins.tourLead.setValue(text);
        }
        else if (target.name === "tags") {
            task.ins.tourTags.setValue(text);
        }
    }

    protected onActiveDocument(previous: CVDocument, next: CVDocument)
    {
        if (previous) {
            previous.setup.tours.outs.tourIndex.off("value", this.onUpdate, this);
        }
        if (next) {
            next.setup.tours.outs.tourIndex.on("value", this.onUpdate, this);
        }

        this.requestUpdate();
    }
}

interface ISelectTourEvent extends CustomEvent
{
    target: TourList;
    detail: {
        tour: ITour;
        index: number;
    }
}

@customElement("sv-tour-list")
export class TourList extends List<ITour>
{
    @property({ attribute: false })
    selectedItem: ITour = null;

    protected firstConnected()
    {
        super.firstConnected();
        this.classList.add("sv-tour-list");
    }

    protected renderItem(item: ITour)
    {
        return item.title;
    }

    protected isItemSelected(item: ITour)
    {
        return item === this.selectedItem;
    }

    protected onClickItem(event: MouseEvent, item: ITour, index: number)
    {
        this.dispatchEvent(new CustomEvent("select", {
            detail: { tour: item, index }
        }));
    }

    protected onClickEmpty(event: MouseEvent)
    {
        this.dispatchEvent(new CustomEvent("select", {
            detail: { tour: null, index: -1 }
        }));
    }
}