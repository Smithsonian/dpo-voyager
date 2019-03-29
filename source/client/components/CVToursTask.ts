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

import { ITweenState } from "@ff/graph/components/CTweenMachine";

import CVTask, { types } from "./CVTask";
import ToursTaskView from "../ui/story/ToursTaskView";

import Tour from "../models/Tour";
import CVDocument from "./CVDocument";
import CVTours from "./CVTours";

////////////////////////////////////////////////////////////////////////////////

export default class CVToursTask extends CVTask
{
    static readonly typeName: string = "CVToursTask";

    static readonly text: string = "Tours";
    static readonly icon: string = "globe";

    protected static readonly ins = {
        activeTour: types.Object("Tours.Active", Tour),
    };

    protected static readonly outs = {
    };

    ins = this.addInputs<CVTask, typeof CVToursTask.ins>(CVToursTask.ins);
    outs = this.addOutputs<CVTask, typeof CVToursTask.outs>(CVToursTask.outs);

    private _tourComponent: CVTours = null;
    private _activeStep: ITweenState = null;

    get activeStep() {
        return this._activeStep;
    }
    set activeStep(step: ITweenState) {
        if (step !== this._activeStep) {

        }
    }

    createView()
    {
        return new ToursTaskView(this);
    }

    createTour()
    {
        const tour = new Tour();
        this._tourComponent.tours.append(tour);
        this._tourComponent.activeTour = tour;
    }

    deleteTour()
    {
        const component = this._tourComponent;
        let index = component.tours.removeItem(this.ins.activeTour.value);
        index = Math.min(index, component.tours.length - 1);
        component.activeTour = component.tours.getAt(index);
    }

    moveTourUp()
    {
        this._tourComponent.tours.moveItem(this.ins.activeTour.value, -1);
    }

    moveTourDown()
    {
        this._tourComponent.tours.moveItem(this.ins.activeTour.value, 1);
    }

    createStep()
    {

    }

    deleteStep()
    {

    }

    protected onActiveDocument(previous: CVDocument, next: CVDocument)
    {
        if (previous) {
            previous.setup.tours.outs.activeTour.unlinkFrom(this.ins.activeTour);
        }
        if (next) {
            next.setup.tours.outs.activeTour.linkTo(this.ins.activeTour);
        }

        this._tourComponent = next.setup.tours;
    }
}