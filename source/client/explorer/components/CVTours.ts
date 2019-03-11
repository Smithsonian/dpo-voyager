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

import clone from "@ff/core/clone";

import Component, { ITypedEvent, types } from "@ff/graph/Component";
import CTweenMachine, { IMachineState, ITweenTarget } from "@ff/graph/components/CTweenMachine";

import { ITour } from "common/types/features";
import Property from "@ff/graph/Property";

////////////////////////////////////////////////////////////////////////////////

export enum EToursState { Off, Select, Playing }

export interface ITourUpdateEvent extends ITypedEvent<"tour">
{
    tour: ITour;
}

export default class CVTours extends Component
{
    static readonly typeName: string = "CVTours";

    protected static readonly ins = {
        enabled: types.Boolean("Tours.Enabled"),
        tour: types.Option("Tours.Tour", []),
    };

    protected static readonly outs = {
        state: types.Enum("Player.State", EToursState),
        title: types.String("Tour.Title"),
        description: types.String("Tour.Description"),
        step: types.Integer("Tour.Step"),
        count: types.Integer("Tour.Steps"),
    };

    ins = this.addInputs(CVTours.ins);
    outs = this.addOutputs(CVTours.outs);

    private _tours: ITour[] = [];
    private _activeTourIndex = -1;
    private _defaultTargets: ITweenTarget[] = [];

    get tweenMachine() {
        return this.getComponent(CTweenMachine);
    }

    get tours() {
        return this._tours;
    }
    get activeTour() {
        const index = this._activeTourIndex;
        return index >= 0 ? this._tours[index] : null;
    }
    set activeTour(tour: ITour) {
        const activeTour = this.activeTour;
        const tours = this._tours;

        if (tour !== activeTour) {
            if (activeTour) {
                const state: IMachineState = this.tweenMachine.deflateState();
                activeTour.steps = state.states || [];
                activeTour.targets = state.targets || [];
            }

            this._activeTourIndex = tour ? tours.indexOf(tour) : -1;

            if (tour) {
                const outs = this.outs;
                outs.title.setValue(tour.title);
                outs.description.setValue(tour.description);
                outs.step.setValue(0);
                outs.count.setValue(tour.steps.length);

                const state = { states: tour.steps, targets: tour.targets };
                this.tweenMachine.inflateState(state);
            }

            this.emit<ITourUpdateEvent>({ type: "tour", tour });
        }
    }

    create()
    {
        this.updateTourList();
    }

    update()
    {
        const { ins, outs } = this;

        const isEnabled = ins.enabled.value;

        if (ins.enabled.changed) {
            const index = ins.tour.value;

            outs.state.setValue(isEnabled ? (index > 0 ? EToursState.Playing : EToursState.Select) : EToursState.Off);
        }

        if (!isEnabled) {
            return ins.enabled.changed;
        }

        if (ins.tour.changed) {
            const index = ins.tour.getValidatedValue() - 1;
            if (index >= 0) {
                this.activeTour = this._tours[index];
                outs.state.setValue(EToursState.Playing);
            }
            else {
                this.activeTour = null;
                outs.state.setValue(EToursState.Select);
            }
        }

        return true;
    }

    createTour()
    {
        const tour = {
            title: "New Tour",
            description: "",
            steps: [],
            targets: clone(this._defaultTargets),
        };

        this._tours.push(tour);
        this.updateTourList();
        this.activeTour = tour;
    }

    deleteTour()
    {
        const tours = this._tours;
        const index = this._activeTourIndex;

        this._tours.splice(index, 1);
        this._activeTourIndex = -1;

        this.updateTourList();
        this.activeTour = index < tours.length ? tours[index] : tours[index - 1];
    }

    updateTour()
    {
        this.emit<ITourUpdateEvent>({ type: "tour", tour: this.activeTour });
    }

    moveTourUp()
    {
        const tours = this._tours;
        const index = this._activeTourIndex;

        if (index > 0) {
            const activeTour = tours[index];
            tours[index] = tours[index - 1];
            tours[index - 1] = activeTour;
            this._activeTourIndex = index - 1;
            this.updateTourList();
        }
    }

    moveTourDown()
    {
        const tours = this._tours;
        const index = this._activeTourIndex;

        if (index + 1 < tours.length) {
            const activeTour = tours[index];
            tours[index] = tours[index + 1];
            tours[index + 1] = activeTour;
            this._activeTourIndex = index + 1;
            this.updateTourList();
        }
    }

    addTarget(component: Component, property: Property)
    {
        this._defaultTargets.push({ id: component.id, key: property.key });
    }

    fromData(tours: ITour[])
    {
        this._tours = tours;
    }

    toData(): ITour[]
    {
        return this._tours;
    }

    protected updateTourList()
    {
        const names = this._tours.map(tour => tour.title);
        names.unshift("(none)");
        this.ins.tour.setOptions(names);

        this.emit("update");
    }
}