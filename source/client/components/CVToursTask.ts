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

import { EEasingCurve } from "@ff/graph/components/CTweenMachine";

import CVTask, { types } from "./CVTask";
import ToursTaskView from "../ui/story/ToursTaskView";

import CVDocument from "./CVDocument";

////////////////////////////////////////////////////////////////////////////////

let _INDEX = 0;

export default class CVToursTask extends CVTask
{
    static readonly typeName: string = "CVToursTask";

    static readonly text: string = "Tours";
    static readonly icon: string = "globe";

    protected static readonly ins = {
        tourIndex: types.Integer("Tours.Index", -1),
        createTour: types.Event("Tours.Create"),
        deleteTour: types.Event("Tours.Delete"),
        moveTourUp: types.Event("Tours.MoveUp"),
        moveTourDown: types.Event("Tours.MoveDown"),
        tourTitle: types.String("Tour.Title"),
        tourLead: types.String("Tour.Lead"),
        tourTags: types.String("Tour.Tags"),
        stepIndex: types.Integer("Steps.Index", -1),
        updateStep: types.Event("Steps.Update"),
        createStep: types.Event("Steps.Create"),
        deleteStep: types.Event("Steps.Delete"),
        moveStepUp: types.Event("Steps.MoveUp"),
        moveStepDown: types.Event("Steps.MoveDown"),
        stepName: types.String("Steps.Name"),
        stepCurve: types.Enum("Step.Curve", EEasingCurve),
        stepDuration: types.Number("Step.Duration", 1),
        stepThreshold: types.Percent("Step.Threshold", 0.5),
    };

    protected static readonly outs = {
        tourIndex: types.Integer("Task.ActiveTour", -1),
        stepIndex: types.Integer("Task.ActiveStep", -1),
    };

    ins = this.addInputs<CVTask, typeof CVToursTask.ins>(CVToursTask.ins);
    outs = this.addOutputs<CVTask, typeof CVToursTask.outs>(CVToursTask.outs);

    get tours() {
        const component = this.tourComponent;
        return component ? component.tours : null;
    }
    get activeTour() {
        const tours = this.tours;
        return tours ? tours[this.outs.tourIndex.value] : null;
    }
    get activeTourSteps() {
        const component = this.tourComponent;
        return component ? component.tweenMachine.states : null;
    }
    get activeStep() {
        const steps = this.activeTourSteps;
        return steps ? steps[this.outs.stepIndex.value] : null;
    }

    protected get tourComponent() {
        const document = this.activeDocument;
        return document ? document.setup.tours : null;
    }

    update(context)
    {
        const { ins, outs } = this;

        const tourComponent = this.tourComponent;

        if (!tourComponent) {
            return false;
        }

        const tours = tourComponent.tours;
        const tourIndex = ins.tourIndex.value;
        const tour = tours[tourIndex];

        if (ins.tourIndex.changed) {
            tourComponent.ins.index.setValue(tourIndex);
            outs.tourIndex.setValue(tourIndex);
            ins.tourTitle.setValue(tour ? tour.title : "", true);
            ins.tourLead.setValue(tour ? tour.lead : "", true);
            ins.tourTags.setValue(tour ? tour.tags.join(", ") : "", true);
        }

        const machineComponent = tourComponent.tweenMachine;
        const stepIndex = ins.stepIndex.value;
        const steps = machineComponent.states;
        const step = steps[stepIndex];

        //console.log("CVToursTask.update - inTourIndex: %s, inStepIndex: %s", ins.tourIndex.value, ins.stepIndex.value);

        if (ins.stepIndex.changed) {
            outs.stepIndex.setValue(ins.stepIndex.value);
            ins.stepName.setValue(step ? step.name : "", true);
            ins.stepCurve.setValue(step ? step.curve : 0, true);
            ins.stepDuration.setValue(step ? step.duration : 1, true);
            ins.stepThreshold.setValue(step ? step.threshold : 0.5, true);
        }

        if (tour) {
            // tour step actions
            if (ins.createStep.changed) {
                steps.splice(stepIndex + 1, 0, {
                    values: machineComponent.getCurrentValues(),
                    name: "New Step #" + _INDEX++,
                    duration: 1,
                    curve: EEasingCurve.EaseCubic,
                    threshold: 0.5
                });
                machineComponent.ins.index.setValue(stepIndex + 1);
            }

            if (step) {
                if (ins.stepName.changed || ins.stepCurve.changed ||
                    ins.stepDuration.changed || ins.stepThreshold.changed) {

                    step.name = ins.stepName.value;
                    step.curve = ins.stepCurve.value;
                    step.duration = ins.stepDuration.value;
                    step.threshold = ins.stepThreshold.value;
                }

                if (ins.updateStep.changed) {
                    step.values = machineComponent.getCurrentValues();
                }
                if (ins.deleteStep.changed) {
                    steps.splice(stepIndex, 1);
                    machineComponent.ins.index.setValue(stepIndex);
                }
                if (stepIndex > 0 && ins.moveStepUp.changed) {
                    steps[stepIndex] = steps[stepIndex - 1];
                    steps[stepIndex - 1] = step;
                    machineComponent.ins.index.setValue(stepIndex - 1);
                }
                if (stepIndex < steps.length - 1 && ins.moveStepDown.changed) {
                    steps[stepIndex] = steps[stepIndex + 1];
                    steps[stepIndex + 1] = step;
                    machineComponent.ins.index.setValue(stepIndex + 1);
                }
            }

            // tour actions
            if (ins.tourTitle.changed || ins.tourLead.changed || ins.tourTags.changed) {
                tour.title = ins.tourTitle.value;
                tour.lead = ins.tourLead.value;
                tour.tags = ins.tourTags.value.split(",").map(tag => tag.trim());
            }
            if (ins.deleteTour.changed) {
                tours.splice(tourIndex, 1);
                tourComponent.ins.index.setValue(tourIndex);
            }
            if (tourIndex > 0 && ins.moveTourUp.changed) {
                tours[tourIndex] = tours[tourIndex - 1];
                tours[tourIndex - 1] = tour;
                tourComponent.ins.index.setValue(tourIndex - 1);
            }
            if (tourIndex < tours.length - 1 && ins.moveTourDown.changed) {
                tours[tourIndex] = tours[tourIndex + 1];
                tours[tourIndex + 1] = tour;
                tourComponent.ins.index.setValue(tourIndex + 1);
            }
        }

        if (ins.createTour.changed) {
            tours.splice(tourIndex + 1, 0, {
                title: "New Tour #" + _INDEX++,
                lead: "",
                tags: [],
                states: []
            });
            tourComponent.ins.index.setValue(tourIndex + 1);
        }

        //console.log("CVToursTask.update - outTourIndex: %s, outStepIndex: %s", outs.tourIndex.value, outs.stepIndex.value);

        return true;
    }

    createView()
    {
        return new ToursTaskView(this);
    }

    protected onActiveDocument(previous: CVDocument, next: CVDocument)
    {
        if (previous) {
            const tours = previous.setup.tours;
            tours.outs.index.unlinkFrom(this.ins.tourIndex);
            tours.tweenMachine.outs.index.unlinkFrom(this.ins.stepIndex);
        }
        if (next) {
            const tours = next.setup.tours;
            tours.outs.index.linkTo(this.ins.tourIndex);
            tours.tweenMachine.outs.index.linkTo(this.ins.stepIndex);
        }
    }
}