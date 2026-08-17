/**
 * 3D Foundation Project
 * Copyright 2026 Smithsonian Institution
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
import { IComponentEvent } from "@ff/graph/Component";
import { EEasingCurve, IDeltaState, ITweenState } from "@ff/graph/components/CTweenMachine";

import Table, { ITableColumn, ITableRowClickEvent } from "@ff/ui/Table";

import CVDocument from "../../components/CVDocument";
import CVTours from "../../components/CVTours";

import DocumentView, { customElement, html, TemplateResult } from "../explorer/DocumentView";
import { ILineEditChangeEvent } from "@ff/ui/LineEdit";
import Property from "@ff/graph/Property";
import uniqueId from "@ff/core/uniqueId";

////////////////////////////////////////////////////////////////////////////////

interface IStepEntry
{
    title: string | TemplateResult;
    duration: string;
    changes: string;
}

@customElement("sv-state-panel")
export default class StatePanel extends DocumentView
{
    protected static tableColumns: ITableColumn<IStepEntry>[] = [
        { header: "#", width: 0.05, cell: (row, index) => (index + 1).toString() },
        { header: "Title", width: 0.4, cell: "title" },
        { header: "Duration", width: 0.15, cell: "duration" },
        { header: "Changes", width: 0.4, cell: "changes" },
    ];

    protected stateTable: Table<IStepEntry> = null;
    protected subscriber: Subscriber = null;
    protected isRecording: boolean = false;
    protected activeState: IDeltaState = null;
    tours: CVTours = null;

    private _startValues: any[] = null;
    private _activeIndex: number = null;

    protected get snapshots() {
        return this.activeDocument.setup.snapshots;
    }

    protected firstConnected()
    {
        super.firstConnected();
        this.classList.add("sv-panel", "sv-state-panel");

        this.stateTable = new Table();
        this.stateTable.columns = StatePanel.tableColumns;
        this.stateTable.placeholder = "Start by creating a tour step.";
        this.stateTable.addEventListener("rowclick", this.onClickTableRow.bind(this));

        this.subscriber = new Subscriber("value", this.onUpdate, this);
    }

    protected connected()
    {
        super.connected();

        this.activeDocument.setup.language.outs.uiLanguage.on("value", this.onUpdate, this);
    }

    protected disconnected()
    {
       
        this.activeDocument.setup.language.outs.uiLanguage.off("value", this.onUpdate, this);
        super.disconnected();
    }

    protected render()
    {
        if(!this.activeDocument) {
            return;
        }

        const machine = this.snapshots;
        const languageManager = this.activeDocument.setup.language;
        const activeState = this.activeState;

        const tagDisplay = activeState ? html`<div class="sv-property-tags"><div class="sv-tags-selected">
                    ${activeState.paths.map((path, index) => html`<div class="sv-tag-chip">
                        <span class="sv-tag-chip-label">${path.split('/').pop()}</span>
                        <ff-button class="sv-tag-chip-remove" icon="close" title=${languageManager ? languageManager.getLocalizedString("Remove tag") : "Remove tag"} @click=${() => this.onRemoveTag(index)}></ff-button>
                    </div>`)}
                </div></div>` : null;
        
        const stepDetailView = activeState ? html`<div class="ff-scroll-y ff-flex-column sv-detail-view">
            <div class="sv-label">Title</div>
            <ff-line-edit name="Title" text=${activeState.title} @change=${this.onTitleEdit}></ff-line-edit>
            <sv-property-view .property=${machine.ins.curve}></sv-property-view>
            <sv-property-view .property=${machine.ins.duration} commitonly></sv-property-view>
            <sv-property-view .property=${machine.ins.threshold} commitonly></sv-property-view>
            <div class="sv-label">Changes</div>
            ${tagDisplay}
        </div>` : html`<div class="ff-placeholder"><div>${languageManager.getUILocalizedString("Create or select a state change to edit.")}</div></div>`;

        this.stateTable.rows = machine.deltaStates.map(delta => {
            const state = this.snapshots.getState(delta.id) as IDeltaState;
            return {
                title: state.title,
                duration: state.duration.toFixed(1) + "s",
                changes: state.paths.map(path => path.split('/').pop()).join(', '),
            };
        });

        this.stateTable.selectedRows = this.stateTable.rows[this._activeIndex];

        return html`<div class="sv-panel-header">
            <ff-button class="sv-record" text="${languageManager.getUILocalizedString("Record")}" selectable icon="record" @click=${this.onClickRecord}></ff-button>
            <ff-button text="${languageManager.getUILocalizedString("Delete")}" icon="trash" ?disabled=${!activeState} @click=${this.onClickDelete}></ff-button>
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

    protected onClickTableRow(event: ITableRowClickEvent<IDeltaState>)
    {
        this._activeIndex = event.detail.index;
        const id = this.snapshots.deltaStates[this._activeIndex].id;
        this.setActiveState(id);
    }

    protected onClickRecord()
    {
        this.isRecording = !this.isRecording;

        const featureCache = { ...this.snapshots.targetFeatures };
        Object.keys(this.snapshots.targetFeatures).forEach(key => this.snapshots.targetFeatures[key] = true);
        this.snapshots.updateTargets();

        if(this.isRecording) {        
            this._startValues = this.snapshots.getCurrentValues();
        }
        else {
            const currentValues = this.snapshots.getCurrentValues();
            const deltaPaths : string[] = [];
            const deltaValues = currentValues.filter((value, index) => { 
                const returnVal = Array.isArray(value) ? 
                    !(this._startValues[index].length === value.length && this._startValues[index].every((val, idx) => val === value[idx]))
                    : value != this._startValues[index];
                
                if(returnVal) {
                    const prop = this.snapshots.getTargetProperties()[index];
                    deltaPaths.push(prop.group.linkable.id + "/" + prop.key);
                }
                return returnVal;
            });

            const newState: IDeltaState = {
                id: uniqueId(6),
                values: deltaValues,
                curve: EEasingCurve.EaseOutQuad,
                duration: 1.5,
                threshold: 0.5,
                title: "State"+this.snapshots.deltaStates.length,
                paths: deltaPaths
            };

            this.snapshots.setState(newState);
            this.snapshots.deltaStates.push(newState);
            
            this.setActiveState(newState.id);

            this.requestUpdate();
        }

        Object.keys(this.snapshots.targetFeatures).forEach(key => this.snapshots.targetFeatures[key] = featureCache[key]);
        this.snapshots.updateTargets();
    }

    protected onClickDelete()
    {
        this.snapshots.deleteState(this.activeState.id);

        const idx = this.snapshots.deltaStates.findIndex(state => state.id === this.activeState.id);
        this.snapshots.deltaStates.splice(idx, 1);

        this.activeState = null;
        this._activeIndex = null;
        this.requestUpdate();
    }

    protected onRemoveTag(idx: number)
    {
        this.activeState.paths.splice(idx, 1);
        this.activeState.values.splice(idx, 1);
        this.requestUpdate();
    }

    protected onActiveDocument(previous: CVDocument, next: CVDocument)
    {
        if (previous) {
            this.subscriber.off();
        }
        if (next) {
            this.subscriber.on(
                this.snapshots.outs.update
            );
        }

        this.requestUpdate();
    }

    protected setActiveState(id: string)
    {
        this.activeState = this.snapshots.getState(id) as IDeltaState;
        this.snapshots.ins.id.setValue(id);
        this.snapshots.ins.curve.setValue(this.activeState.curve);
        this.snapshots.ins.threshold.setValue(this.activeState.threshold);
        this.snapshots.ins.duration.setValue(this.activeState.duration);
        this.requestUpdate();
    }

    /*protected onTextEdit(event: ILineEditChangeEvent)
    {
            const target = event.target;
            const text = event.detail.text;

            if (target.name === "altText") {
                //this.toursTask.ins.stepAltText.setValue(text);
            }
    }*/

    protected onTitleEdit(event: ILineEditChangeEvent)
    {
        const text = event.detail.text;
        this.activeState.title = text;

        this.requestUpdate();
    }
}