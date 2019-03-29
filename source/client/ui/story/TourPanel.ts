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

import { EEasingCurve, ITweenState } from "@ff/graph/components/CTweenMachine";

import SystemView, { customElement, html } from "@ff/scene/ui/SystemView";

import Table, { ITableColumn, ITableRowClickEvent } from "@ff/ui/Table";

import CVToursTask from "../../components/CVToursTask";

////////////////////////////////////////////////////////////////////////////////

@customElement("sv-tour-panel")
export default class TourPanel extends SystemView
{
    protected static tableColumns: ITableColumn<ITweenState>[] = [
        { header: "#", width: 0.05, cell: (row, index) => index.toString() },
        { header: "Title", width: 0.4, cell: "title" },
        { header: "Duration", width: 0.15, cell: row => row.duration.toFixed(1) },
        { header: "Curve", width: 0.25, cell: row => EEasingCurve[row.curve] },
        { header: "Thres", width: 0.15, cell: row => row.threshold.toFixed(2) }
    ];

    protected toursTask: CVToursTask = null;
    protected stateTable: Table<ITweenState>;

    protected firstConnected()
    {
        super.firstConnected();
        this.classList.add("sv-panel", "sv-tour-panel");

        this.stateTable = new Table<ITweenState>();
        this.stateTable.columns = TourPanel.tableColumns;
        this.stateTable.placeholder = "Start by creating a tour step.";
        this.stateTable.addEventListener("rowclick", this.onClickTableRow.bind(this));

        this.toursTask = this.system.getMainComponent(CVToursTask);
    }

    protected connected()
    {
        super.connected();
        this.toursTask.outs.isActive.on("value", this.onUpdate, this);
        this.toursTask.ins.activeTour.on("value", this.onUpdate, this);
    }

    protected disconnected()
    {
        this.toursTask.outs.isActive.off("value", this.onUpdate, this);
        this.toursTask.ins.activeTour.off("value", this.onUpdate, this);
        super.disconnected();
    }

    protected renderStep(step: ITweenState)
    {
        if (!step) {
            return html`<div class="ff-placeholder">
                <div>Create or select a tour step to edit.</div>
            </div>`;
        }

        // TODO: Step detail view
        return html`<div class="ff-flex-column">
        </div>`;
    }

    protected render()
    {
        if (!this.toursTask.outs.isActive.value) {
            return html`<div class="ff-placeholder">Please select 'Tours' from the menu bar to edit tours.</div>`;
        }

        const tour = this.toursTask.ins.activeTour.value;
        if (!tour) {
            return html`<div class="ff-placeholder">Please create or select a tour to edit.</div>`
        }

        const activeStep = null;

        return html`<div class="sv-panel-content">
            <div class="ff-flex-column sv-list">
                <div class="sv-panel-header">
                    <ff-button text="Add Step" icon="create" @click=${this.onClickCreate}></ff-button>
                    <ff-button text="Move Up" icon="up" ?disabled=${!activeStep} @click=${this.onClickUp}></ff-button>
                    <ff-button text="Move Down" icon="down" ?disabled=${!activeStep} @click=${this.onClickDown}></ff-button>
                    <ff-button text="Delete Step" icon="trash" ?disabled=${!activeStep} @click=${this.onClickDelete}></ff-button>
                </div>
                ${this.stateTable}
            </div>
            <ff-splitter></ff-splitter>
            <div class="ff-flex-column sv-details">
                ${this.renderStep(activeStep)}
            </div>
        </div>`;
    }

    protected onClickTableRow(event: ITableRowClickEvent<ITweenState>)
    {

    }

    protected onClickCreate()
    {

    }

    protected onClickDelete()
    {

    }

    protected onClickUp()
    {

    }

    protected onClickDown()
    {

    }
}