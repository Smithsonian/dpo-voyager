/**
 * 3D Foundation Project
 * Copyright 2024 Smithsonian Institution
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

import { Node } from "@ff/graph/Component";

import CVTask, { types } from "./CVTask";
import ToursTaskView from "../ui/story/ToursTaskView";

import CVDocument from "./CVDocument";
import CVTours from "./CVTours";
import CVSnapshots, { EEasingCurve } from "./CVSnapshots";
import { ELanguageStringType, ELanguageType, DEFAULT_LANGUAGE } from "client/schema/common";

////////////////////////////////////////////////////////////////////////////////

let _nextTourIndex = 0;
let _nextStepIndex = 0;

export default class CVToursTask extends CVTask
{
    static readonly typeName: string = "CVToursTask";

    static readonly text: string = "Tours";
    static readonly icon: string = "globe";

    protected static readonly ins = {
        createTour: types.Event("Tours.Create"),
        deleteTour: types.Event("Tours.Delete"),
        moveTourUp: types.Event("Tours.MoveUp"),
        moveTourDown: types.Event("Tours.MoveDown"),
        tourTitle: types.String("Tour.Title"),
        tourLead: types.String("Tour.Lead"),
        tourTags: types.String("Tour.Tags"),
        updateStep: types.Event("Step.Update"),
        createStep: types.Event("Step.Create"),
        deleteStep: types.Event("Step.Delete"),
        moveStepUp: types.Event("Step.MoveUp"),
        moveStepDown: types.Event("Step.MoveDown"),
        stepTitle: types.String("Step.Title"),
        stepCurve: types.Enum("Step.Curve", EEasingCurve),
        stepDuration: types.Number("Step.Duration", 1),
        stepThreshold: types.Percent("Step.Threshold", 0.5),
        stepAltText: types.String("Step.AltText")
    };

    protected static readonly outs = {
    };

    ins = this.addInputs<CVTask, typeof CVToursTask.ins>(CVToursTask.ins);
    outs = this.addOutputs<CVTask, typeof CVToursTask.outs>(CVToursTask.outs);

    tours: CVTours = null;
    machine: CVSnapshots = null;

    constructor(node: Node, id: string)
    {
        super(node, id);

        const configuration = this.configuration;
        configuration.bracketsVisible = false;
    }

    create()
    {
        super.create();
        this.startObserving();
    }

    dispose()
    {
        this.stopObserving();
        super.dispose();
    }

    update(context)
    {
        const ins = this.ins;
        const tours = this.tours;
        const machine = this.machine;

        if (!tours || !this.activeDocument) {
            return false;
        }

        const tourList = tours.tours;
        const tourIndex = tours.outs.tourIndex.value;
        const tour = tourList[tourIndex];

        const languageManager = this.activeDocument.setup.language;


        if (tour) {
            const stepList = tour.steps;
            const stepIndex = tours.outs.stepIndex.value;
            const step = stepList[stepIndex];

            // tour step actions
            if (ins.createStep.changed) {
                const id = machine.setState({
                    values: machine.getCurrentValues(),
                    curve: EEasingCurve.EaseOutQuad,
                    duration: 1.5,
                    threshold: 0.5,
                });

                stepList.splice(stepIndex + 1, 0, {
                    title: "",
                    titles: {},
                    id
                });
                stepList[stepIndex + 1].titles[DEFAULT_LANGUAGE] = "New Step #" + _nextStepIndex++;

                tours.ins.stepIndex.setValue(stepIndex + 1);
                return true;
            }

            if (step) {
                if (ins.stepTitle.changed || ins.stepCurve.changed ||
                        ins.stepDuration.changed || ins.stepThreshold.changed || 
                        ins.stepAltText.changed) {

                    tours.stepTitle = ins.stepTitle.value;
                    tours.stepAltText = ins.stepAltText.value;
                    machine.ins.curve.setValue(ins.stepCurve.value);
                    machine.ins.duration.setValue(ins.stepDuration.value);
                    machine.ins.threshold.setValue(ins.stepThreshold.value);
                    tours.ins.stepIndex.setValue(stepIndex);
                    return true;
                }

                if (ins.updateStep.changed) {
                    machine.ins.store.set();
                    return true;
                }
                if (ins.deleteStep.changed) {
                    stepList.splice(stepIndex, 1);
                    machine.ins.delete.set();
                    tours.ins.stepIndex.setValue(stepIndex);
                    return true;
                }
                if (stepIndex > 0 && ins.moveStepUp.changed) {
                    stepList[stepIndex] = stepList[stepIndex - 1];
                    stepList[stepIndex - 1] = step;
                    tours.ins.stepIndex.setValue(stepIndex - 1);
                    return true;
                }
                if (stepIndex < stepList.length - 1 && ins.moveStepDown.changed) {
                    stepList[stepIndex] = stepList[stepIndex + 1];
                    stepList[stepIndex + 1] = step;
                    tours.ins.stepIndex.setValue(stepIndex + 1);
                    return true;
                }
            }

            // tour actions
            if (ins.tourTitle.changed || ins.tourLead.changed || ins.tourTags.changed) {
                tours.title = ins.tourTitle.value;
                tours.lead = ins.tourLead.value;
                tours.taglist = ins.tourTags.value.split(",").map(tag => tag.trim()).filter(tag => !!tag);
                tours.ins.tourIndex.set();
                return true;
            }
            if (ins.deleteTour.changed) {
                tour.steps.forEach(step => machine.deleteState(step.id));
                tourList.splice(tourIndex, 1);
                tours.ins.tourIndex.setValue(tourIndex);
                tours.outs.count.setValue(tourList.length);
                return true;
            }
            if (tourIndex > 0 && ins.moveTourUp.changed) {
                tourList[tourIndex] = tourList[tourIndex - 1];
                tourList[tourIndex - 1] = tour;
                tours.ins.tourIndex.setValue(tourIndex - 1);
                return true;
            }
            if (tourIndex < tourList.length - 1 && ins.moveTourDown.changed) {
                tourList[tourIndex] = tourList[tourIndex + 1];
                tourList[tourIndex + 1] = tour;
                tours.ins.tourIndex.setValue(tourIndex + 1);
                return true;
            }
        }

        if (ins.createTour.changed) {
            tourList.splice(tourIndex + 1, 0, {
                title: "",
                titles: {},
                lead: "",
                leads: {},
                tags: [],
                taglist: {},
                steps: []
            });
            tourList[tourIndex + 1].titles[DEFAULT_LANGUAGE] = "New Tour #" + _nextTourIndex++;
            tours.ins.tourIndex.setValue(tourIndex + 1);
            tours.outs.count.setValue(tourList.length);
            languageManager.ins.language.setValue(ELanguageType[DEFAULT_LANGUAGE]);
            return true;
        }

        return true;
    }

    createView()
    {
        return new ToursTaskView(this);
    }

    activateTask()
    {
        super.activateTask();

        if (this.tours) {
            this.tours.ins.enabled.setValue(true);
        }
    }

    deactivateTask()
    {
        if (this.tours && this.tours.outs.count.value === 0) {
            this.tours.ins.enabled.setValue(false);
        }

        super.deactivateTask();
    }

    protected onActiveDocument(previous: CVDocument, next: CVDocument)
    {
        if (previous) {
            if (this.isActiveTask) {
                this.tours.ins.enabled.setValue(false);
            }

            this.tours.outs.tourIndex.off("value", this.onTourChange, this);
            this.tours.outs.stepIndex.off("value", this.onStepChange, this);
            previous.setup.language.outs.language.off("value", this.onDocumentLanguageChange, this);

            this.tours = null;
            this.machine = null;
        }
        if (next) {
            this.tours = next.setup.tours;
            this.machine = this.tours.getComponent(CVSnapshots);

            this.tours.outs.tourIndex.on("value", this.onTourChange, this);
            this.tours.outs.stepIndex.on("value", this.onStepChange, this);
            next.setup.language.outs.language.on("value", this.onDocumentLanguageChange, this);

            if (this.isActiveTask) {
                this.tours.ins.enabled.setValue(true);
            }
        }

        this.changed = true;
    }

    protected onTourChange()
    {
        const ins = this.ins;
        const tours = this.tours;
        const tour = tours.activeTour;

        ins.tourTitle.setValue(tour ? tours.title : "", true);
        ins.tourLead.setValue(tour ? tours.lead : "", true);
        ins.tourTags.setValue(tour ? tours.taglist.join(", ") : "", true);
    }

    protected onStepChange()
    {
        const ins = this.ins;
        const step = this.tours.activeStep;
        const state = step ? this.machine.getState(step.id) : null;

        ins.stepTitle.setValue(step ? this.tours.stepTitle : "", true);
        ins.stepAltText.setValue(step ? this.tours.stepAltText : "", true);
        ins.stepCurve.setValue(state ? state.curve : EEasingCurve.Linear, true);
        ins.stepDuration.setValue(state ? state.duration : 1, true);
        ins.stepThreshold.setValue(state ? state.threshold : 0.5, true);
    }

    protected onDocumentLanguageChange()
    {
        const tours = this.tours;

        this.onTourChange();
        this.onStepChange();
        tours.ins.tourIndex.setValue(tours.outs.tourIndex.value);  // trigger UI refresh
    }

}