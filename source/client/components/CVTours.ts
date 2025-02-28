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

import Component, { types } from "@ff/graph/Component";
import { ITweenState } from "@ff/graph/components/CTweenMachine";
import { IPulseContext } from "@ff/graph/components/CPulse";

import { ITour, ITours, ITourStep } from "client/schema/setup";
import { ELanguageType, DEFAULT_LANGUAGE } from "client/schema/common";

import CVSnapshots, { EEasingCurve } from "./CVSnapshots";
import CVAnalytics from "./CVAnalytics";
import CVLanguageManager from "./CVLanguageManager";
import CVSetup from "./CVSetup";

////////////////////////////////////////////////////////////////////////////////

export default class CVTours extends Component
{
    static readonly typeName: string = "CVTours";
    static readonly sceneSnapshotId = "scene-default";

    protected static readonly ins = {
        enabled: types.Boolean("Tours.Enabled"),
        tourIndex: types.Integer("Tours.Index", -1),
        closed: types.Event("Tours.Closed"),
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
        ending: types.Boolean("Tour.Ending"),
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
    protected get setup() {
        return this.getGraphComponent(CVSetup);
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

    get title() {
        const tour = this.activeTour;
        // TODO: Temporary - remove when single string properties are phased out
        if(Object.keys(tour.titles).length === 0) {
            tour.titles[DEFAULT_LANGUAGE] = tour.title;
        }

        return tour.titles[ELanguageType[this.language.outs.language.value]] || "undefined";
    }
    set title(inTitle: string) {
        const tour = this.activeTour;
        tour.titles[ELanguageType[this.language.outs.language.value]] = inTitle; 
    }
    get lead() {
        const tour = this.activeTour;
        // TODO: Temporary - remove when single string properties are phased out
        if(Object.keys(tour.leads).length === 0) {
            tour.leads[DEFAULT_LANGUAGE] = tour.lead;
        }

        return tour.leads[ELanguageType[this.language.outs.language.value]] || "";
    }
    set lead(inLead: string) {
        const tour = this.activeTour;
        tour.leads[ELanguageType[this.language.outs.language.value]] = inLead;
    }
    get taglist() {
        const tour = this.activeTour;
        // TODO: Temporary - remove when single string properties are phased out
        if(Object.keys(tour.taglist).length === 0) {
            if(tour.tags.length > 0) {
                tour.taglist[DEFAULT_LANGUAGE] = tour.tags;
            }
        }

        return tour.taglist[ELanguageType[this.language.outs.language.value]] || [];
    }
    set taglist(inTags: string[]) {
        const tour = this.activeTour;
        tour.taglist[ELanguageType[this.language.outs.language.value]] = inTags;
    }
    get stepTitle() {
        const step = this.activeStep;

        if(step) {
            // TODO: Temporary - remove when single string properties are phased out
            if(Object.keys(step.titles).length === 0) {
                step.titles[DEFAULT_LANGUAGE] = step.title;
            }

            return step.titles[ELanguageType[this.language.outs.language.value]] || "undefined";
        }
        else {
            return null;
        }
    }
    set stepTitle(inTitle: string) {
        const step = this.activeStep;
        if(step) {
            step.titles[ELanguageType[this.language.outs.language.value]] = inTitle;
        }
    }
    get stepAltText() {
        const step = this.activeStep;

        if(step) {
            return step.altTexts[ELanguageType[this.language.outs.language.value]] || "undefined";
        }
        else {
            return null;
        }
    }
    set stepAltText(inText: string) {
        const step = this.activeStep;
        if(step) {
            step.altTexts[ELanguageType[this.language.outs.language.value]] = inText;
        }
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
        const navigation = this.setup.navigation;
        const srElement = this.setup.viewer.rootElement.shadowRoot.querySelector("#sceneview-sr");

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

                this.normalizeViewOrbit(CVTours.sceneSnapshotId);

                // recall pre-tour scene state
                machine.tweenTo(CVTours.sceneSnapshotId, context.secondsElapsed);
                machine.deleteState(CVTours.sceneSnapshotId);

                srElement.textContent = "";

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
            outs.tourTitle.setValue(tour ? this.title : "");
            outs.tourLead.setValue(tour ? this.lead : "");
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
                outs.ending.setValue(true);
                outs.tourIndex.setValue(-1);
                outs.tourTitle.setValue("");
                outs.tourLead.setValue("");
                outs.stepIndex.set();
                nextStepIndex = -1;
                srElement.textContent = "";
            }
        }
        if (ins.previous.changed) {
            // previous step, wrap around when reaching first step
            nextStepIndex = (outs.stepIndex.value + stepCount - 1) % stepCount;
        }

        // normalize orbit on tour start
        if(nextStepIndex === 0) {
            this.normalizeViewOrbit(tour.steps[0].id);
        }

        if (nextStepIndex >= 0) {
            navigation.setChanged(true); // disable autoZoom
            // tween to the next step
            const step = tour.steps[nextStepIndex];
            outs.stepIndex.setValue(nextStepIndex);
            outs.stepTitle.setValue(this.stepTitle || "undefined");
            machine.ins.id.setValue(step.id);
            tween ? machine.ins.tween.set() : machine.ins.recall.set();
            srElement.textContent = this.stepAltText != "undefined" ? "Alt text: " + this.stepAltText : "";
        }

        return true;
    }

    fromData(data: ITours)
    {
        this._tours = data.map(tour => ({
            title: tour.title,
            titles: tour.titles || {},
            steps: tour.steps.map(step => ({
                title: step.title,
                titles: step.titles || {},
                altTexts: step.altTexts || {},
                id: step.id,
            })),
            lead: tour.lead || "",
            leads: tour.leads || {},
            tags: tour.tags || [],
            taglist: tour.taglist || {}
        }));

        // update langauges used in tours
        this._tours.forEach( tour => {
            Object.keys(tour.titles).forEach( key => {
                this.language.addLanguage(ELanguageType[key]);
            });

            // TODO: Delete when single string properties are phased out
            tour.steps.forEach( step => {
                if(Object.keys(step.titles).length == 0) {
                    step.titles[DEFAULT_LANGUAGE] = step.title || null;
                }
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
                steps: tour.steps.map(step => {
                    const tourstep: Partial<ITourStep> = {};
                    tourstep.id = step.id;
                    if (Object.keys(step.titles).length > 0) {
                        tourstep.titles = step.titles;
                    }
                    else if (step.title) {
                        tourstep.title = step.title;
                    }

                    if (Object.keys(step.altTexts).length > 0) {
                        tourstep.altTexts = step.altTexts;
                    }

                    return tourstep as ITourStep;
                }),
            };

            if (Object.keys(tour.titles).length > 0) {
                data.titles = tour.titles;
            }
            else if (tour.title) {
                data.title = tour.title;
            }
            if (Object.keys(tour.leads).length > 0) {
                data.leads = tour.leads;
            }
            else if (tour.lead) {
                data.lead = tour.lead;
            }
            if (Object.keys(tour.taglist).length > 0) {
                data.taglist = tour.taglist;
            }
            else if (tour.tags.length > 0) {
                data.tags = tour.tags;
            }

            return data as ITour;
        });
    }

    // helper function to bring saved state orbit into alignment with current view orbit
    protected normalizeViewOrbit(viewId: string) {
        const orbitIdx = this.snapshots.getTargetProperties().findIndex(prop => prop.name == "Orbit");
        const viewState = this.snapshots.getState(viewId);
        const currentOrbit = this.snapshots.getCurrentValues()[orbitIdx];
        if(viewState) {
            currentOrbit.forEach((n, i) => {
                const mult = Math.round((viewState.values[orbitIdx][i]-n)/360);
                this.snapshots.getTargetProperties()[orbitIdx].value[i] += 360*mult;
            });
        }
    }
}