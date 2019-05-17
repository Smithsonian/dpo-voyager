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

import { ITour, ITours } from "client/schema/setup";

import CVSnapshots, { EEasingCurve } from "./CVSnapshots";
import { ITweenState } from "@ff/graph/components/CTweenMachine";
import { IPulseContext } from "@ff/graph/components/CPulse";

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

    dispose()
    {
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
                    threshold: 0.5,
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
            outs.tourTitle.setValue(tour ? tour.title : "");
            outs.tourLead.setValue(tour ? tour.lead : "");
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
            nextStepIndex = (outs.stepIndex.value + 1) % stepCount;
        }
        if (ins.previous.changed) {
            nextStepIndex = (outs.stepIndex.value - 1) % stepCount;
        }

        if (nextStepIndex >= 0) {
            const step = tour.steps[nextStepIndex];
            outs.stepIndex.setValue(nextStepIndex);
            outs.stepTitle.setValue(step.title);
            machine.ins.id.setValue(step.id);
            tween ? machine.ins.tween.set() : machine.ins.recall.set();
        }

        return true;
    }

    fromData(data: ITours)
    {
        this._tours = data.map(tour => ({
            title: tour.title,
            steps: tour.steps,
            lead: tour.lead || "",
            tags: tour.tags || [],
        }));

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

            if (tour.lead) {
                data.lead = tour.lead;
            }
            if (tour.tags.length > 0) {
                data.tags = tour.tags;
            }

            return data as ITour;
        });
    }
}