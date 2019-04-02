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

import Subscriber from "@ff/core/Subscriber";
import { EEasingCurve, ITweenState } from "@ff/graph/components/CTweenMachine";

import Table, { ITableColumn, ITableRowClickEvent } from "@ff/ui/Table";

import CVDocument from "../../components/CVDocument";
import CVTours from "../../components/CVTours";
import CVToursTask from "../../components/CVToursTask";

import DocumentView, { customElement, html } from "../explorer/DocumentView";

////////////////////////////////////////////////////////////////////////////////

interface IStepEntry
{
    title: string;
    curve: string;
    duration: string;
    threshold: string;
}

@customElement("sv-tour-panel")
export default class TourPanel extends DocumentView
{
    protected static tableColumns: ITableColumn<IStepEntry>[] = [
        { header: "#", width: 0.05, cell: (row, index) => index.toString() },
        { header: "Title", width: 0.4, cell: "title" },
        { header: "Curve", width: 0.25, cell: "curve" },
        { header: "Duration", width: 0.15, cell: "duration" },
        { header: "Threshold", width: 0.15, cell: "threshold" },
    ];

    protected stateTable: Table<IStepEntry> = null;
    protected subscriber: Subscriber = null;
    tours: CVTours = null;


    protected get toursTask() {
        return this.system.getMainComponent(CVToursTask);
    }

    protected firstConnected()
    {
        super.firstConnected();
        this.classList.add("sv-panel", "sv-tour-panel");

        this.stateTable = new Table();
        this.stateTable.columns = TourPanel.tableColumns;
        this.stateTable.placeholder = "Start by creating a tour step.";
        this.stateTable.addEventListener("rowclick", this.onClickTableRow.bind(this));

        this.subscriber = new Subscriber("value", this.onUpdate, this);
    }

    protected connected()
    {
        super.connected();
        this.toursTask.outs.isActive.on("value", this.onUpdate, this);
    }

    protected disconnected()
    {
        this.toursTask.outs.isActive.off("value", this.onUpdate, this);
        super.disconnected();
    }

    protected onActiveDocument(previous: CVDocument, next: CVDocument)
    {
        if (previous) {
            this.subscriber.off();
        }
        if (next) {
            this.tours = next.setup.tours;
            this.subscriber.on(this.tours.ins.tourIndex, this.tours.outs.stepIndex);
        }

        this.requestUpdate();
    }

    protected render()
    {
        console.log("TourPanel.render");

        const task = this.toursTask;

        if (!task) {
            return html`<div class="ff-placeholder">Tour edit task not available.</div>`;
        }

        if (!task.outs.isActive.value) {
            return html`<div class="ff-placeholder">Please select 'Tours' from the task menu to edit tours.</div>`;
        }

        const tours = this.tours;
        const machine = tours.tweenMachine;

        const tour = tours.activeTour;

        if (!tour) {
            return html`<div class="ff-placeholder">Please create or select a tour to edit.</div>`;
        }

        const activeStep = tours.activeStep;

        const stepDetailView = activeStep ? html`<div class="ff-scroll-y ff-flex-column sv-detail-view">
            <sv-property-view .property=${task.ins.stepTitle}></sv-property-view>
            <sv-property-view .property=${task.ins.stepCurve}></sv-property-view>
            <sv-property-view .property=${task.ins.stepDuration} commitonly></sv-property-view>
            <sv-property-view .property=${task.ins.stepThreshold} commitonly></sv-property-view>
        </div>` : html`<div class="ff-placeholder"><div>Create or select a tour step to edit.</div></div>`;

        this.stateTable.rows = tours.activeSteps.map(step => {
            const state = machine.getState(step.id);
            return {
                title: step.title,
                curve: EEasingCurve[state.curve],
                duration: state.duration.toFixed(1) + "s",
                threshold: (state.threshold * 100).toFixed(0) + "%",
            };
        });

        this.stateTable.selectedRows = this.stateTable.rows[tours.outs.stepIndex.value];

        return html`<div class="sv-panel-header">
            <ff-button text="Update Step" icon="create" @click=${this.onClickUpdate}></ff-button>
            <ff-button text="Add Step" icon="create" @click=${this.onClickCreate}></ff-button>
            <ff-button text="Move Up" icon="up" ?disabled=${!activeStep} @click=${this.onClickUp}></ff-button>
            <ff-button text="Move Down" icon="down" ?disabled=${!activeStep} @click=${this.onClickDown}></ff-button>
            <ff-button text="Delete Step" icon="trash" ?disabled=${!activeStep} @click=${this.onClickDelete}></ff-button>
        </div>
        <div class="ff-flex-item-stretch ff-flex-row">
            <div class="ff-splitter-section" style="flex-basis: 60%">
                <div class="ff-scroll-y ff-flex-column">${this.stateTable}</div>
            </div>
            <ff-splitter></ff-splitter>
            <div class="ff-splitter-section" style="flex-basis: 40%">
                ${stepDetailView}
            </div>
        </div>`;
    }

    protected onClickTableRow(event: ITableRowClickEvent<ITweenState>)
    {
        this.tours.ins.stepIndex.setValue(event.detail.index);
    }

    protected onClickUpdate()
    {
        this.toursTask.ins.updateStep.set();
    }

    protected onClickCreate()
    {
        this.toursTask.ins.createStep.set();
    }

    protected onClickDelete()
    {
        this.toursTask.ins.deleteStep.set();
    }

    protected onClickUp()
    {
        this.toursTask.ins.moveStepUp.set();
    }

    protected onClickDown()
    {
        this.toursTask.ins.moveStepDown.set();
    }
}