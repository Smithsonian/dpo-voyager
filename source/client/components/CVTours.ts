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

import Component, { types } from "@ff/graph/Component";
import { ITweenState } from "@ff/graph/components/CTweenMachine";
import { IPulseContext } from "@ff/graph/components/CPulse";

import { ITour, ITours, ELanguageType } from "client/schema/setup";

import CVSnapshots, { EEasingCurve } from "./CVSnapshots";
import CVAnalytics from "./CVAnalytics";
import CVLanguageManager from "./CVLanguageManager";

////////////////////////////////////////////////////////////////////////////////

export default class CVTours extends Component
{
    static readonly typeName: string = "CVTours";
    static readonly sceneSnapshotId = "scene-default";

    protected static readonly ins = {
        enabled: types.Boolean("Tours.Enabled"),
        tourIndex: types.Integer("Tours.Index", -1),
        stepIndex: types.Integer("Step.Index"),
        next: types.Event("Step.Next"),
        previous: types.Event("Step.Previous"),
        first: types.Event("Step.First"),
    };

    protected static readonly outs = {
        count: types.Integer("Tours.Count"),
        tourIndex: types.Integer("Tour.Index", -1),
        tourTitle: types.String("Tour.Title"),
        tourLead: types.String("Tour.Lead"),
        stepCount: types.Integer("Tour.Steps"),
        stepIndex: types.Integer("Step.Index"),
        stepTitle: types.String("Step.Title"),
    };

    ins = this.addInputs(CVTours.ins);
    outs = this.addOutputs(CVTours.outs);

    private _tours: ITour[] = [];

    protected get analytics() {
        return this.getMainComponent(CVAnalytics);
    }
    protected get language() {
        return this.getGraphComponent(CVLanguageManager);
    }

    get snapshots() {
        return this.getComponent(CVSnapshots);
    }
    get tours() {
        return this._tours;
    }
    get activeSteps() {
        const tour = this.activeTour;
        return tour ? tour.steps : null;
    }
    get activeTour() {
        return this._tours[this.outs.tourIndex.value];
    }
    get activeStep() {
        const tour = this.activeTour;
        return tour ? tour.steps[this.outs.stepIndex.value] : null;
    }

    create()
    {
        super.create();
        this.language.outs.language.on("value", this.update, this);
    }

    dispose()
    {
        this.language.outs.language.off("value", this.update, this);
        super.dispose();
    }

    update(context: IPulseContext)
    {
        const { ins, outs } = this;

        const tours = this._tours;
        const machine = this.snapshots;

        if (ins.enabled.changed) {

            if (ins.enabled.value) {
                // store pre-tour scene state
                const state: ITweenState = {
                    id: CVTours.sceneSnapshotId,
                    curve: EEasingCurve.EaseOutQuad,
                    duration: 1,
                    threshold: 0,
                    values: machine.getCurrentValues(),
                };
                machine.setState(state);
            }
            else {
                outs.tourIndex.set();

                // recall pre-tour scene state
                machine.tweenTo(CVTours.sceneSnapshotId, context.secondsElapsed);
                machine.deleteState(CVTours.sceneSnapshotId);

                return true;
            }
        }

        const tourIndex = Math.min(tours.length - 1, Math.max(-1, ins.tourIndex.value));
        const tour = tours[tourIndex];
        const stepCount = tour ? tour.steps.length : 0;
        outs.stepCount.setValue(stepCount);

        let nextStepIndex = -1;

        if (ins.tourIndex.changed || ins.enabled.changed) {
            if (tourIndex !== outs.tourIndex.value) {
                nextStepIndex = 0;
            }

            outs.tourIndex.setValue(tourIndex);
            outs.tourTitle.setValue(tour ? (Object.keys(tour.titles).length > 0 ? tour.titles[ELanguageType[this.language.outs.language.value]] : tour.title) : "");
            outs.tourLead.setValue(tour ? (Object.keys(tour.leads).length > 0 ? tour.leads[ELanguageType[this.language.outs.language.value]] : tour.lead) : "");
        }

        if (stepCount === 0) {
            outs.stepIndex.setValue(-1);
            outs.stepTitle.setValue("");
            return true;
        }

        let tween = true;

        if (ins.enabled.changed) {
            nextStepIndex = outs.stepIndex.value;
        }
        if (ins.stepIndex.changed) {
            nextStepIndex = Math.min(tour.steps.length - 1, Math.max(0, ins.stepIndex.value));
            tween = false;
        }
        if (ins.first.changed) {
            nextStepIndex = 0;
        }
        if (ins.next.changed) {
            nextStepIndex = outs.stepIndex.value + 1;
            // after last step, show tour menu
            if (nextStepIndex >= stepCount) {
                outs.tourIndex.setValue(-1);
                outs.tourTitle.setValue("");
                outs.tourLead.setValue("");
                nextStepIndex = -1;
            }
        }
        if (ins.previous.changed) {
            // previous step, wrap around when reaching first step
            nextStepIndex = (outs.stepIndex.value + stepCount - 1) % stepCount;
        }

        if (nextStepIndex >= 0) {
            // tween to the next step
            const step = tour.steps[nextStepIndex];
            outs.stepIndex.setValue(nextStepIndex);
            outs.stepTitle.setValue(step.titles && Object.keys(step.titles).length > 0 ? step.titles[ELanguageType[this.language.outs.language.value]] : step.title);
            machine.ins.id.setValue(step.id);
            tween ? machine.ins.tween.set() : machine.ins.recall.set();
        }

        return true;
    }

    fromData(data: ITours)
    {
        this._tours = data.map(tour => ({
            title: tour.title,
            titles: tour.titles || {},
            steps: tour.steps,
            lead: tour.lead || "",
            leads: tour.leads || {},
            tags: tour.tags || [],
        }));

        // update langauges used in tours
        this._tours.forEach( tour => {
            Object.keys(tour.titles).forEach( key => {
                this.language.addLanguage(ELanguageType[key]);
            });
        });

        this.ins.tourIndex.setValue(-1);
        this.outs.count.setValue(this._tours.length);
    }

    toData(): ITours | null
    {
        if (this._tours.length === 0) {
            return null;
        }

        return  this._tours.map(tour => {
            const data: Partial<ITour> = {
                title: tour.title,
                steps: tour.steps,
            };

            if (Object.keys(data.titles).length > 0) {
                data.titles = tour.titles;
            }
            if (tour.lead) {
                data.lead = tour.lead;
            }
            if (Object.keys(data.leads).length > 0) {
                data.leads = tour.leads;
            }
            if (tour.tags.length > 0) {
                data.tags = tour.tags;
            }

            return data as ITour;
        });
    }
}