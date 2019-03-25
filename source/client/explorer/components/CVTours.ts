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

import OrderedCollection from "@ff/core/OrderedCollection";

import Component, { ITypedEvent, types } from "@ff/graph/Component";
import Property from "@ff/graph/Property";

import CTweenMachine, { IMachineState, ITweenTarget } from "@ff/graph/components/CTweenMachine";

import { ITour } from "../models/Tour";
import Tour from "../models/Tour";

////////////////////////////////////////////////////////////////////////////////

export { Tour };
export enum EToursState { Off, Select, Playing }

export interface IActiveTourEvent extends ITypedEvent<"active-tour">
{
    previous: Tour;
    next: Tour;
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

    tours = new OrderedCollection<Tour>();

    private _activeTour: Tour = null;
    private _defaultTargets: ITweenTarget[] = [];

    get tweenMachine() {
        return this.getComponent(CTweenMachine);
    }

    get activeTour() {
        return this._activeTour;
    }
    set activeTour(tour: Tour) {
        const activeTour = this.activeTour;

        if (tour !== activeTour) {
            const outs = this.outs;

            if (activeTour) {
                const state: IMachineState = this.tweenMachine.stateToJSON();
                activeTour.set("states", state.states || []);
                activeTour.set("targets", state.targets || []);
            }

            if (tour) {
                const data = tour.data;
                outs.title.setValue(data.title);
                outs.description.setValue(data.lead);
                outs.step.setValue(0);
                outs.count.setValue(data.states.length);

                const state = { states: data.states, targets: data.targets };
                this.tweenMachine.stateFromJSON(state);

                outs.state.setValue(EToursState.Playing);
            }
            else {
                outs.state.setValue(EToursState.Select);
            }

            this._activeTour = tour;
            this.emit<IActiveTourEvent>({ type: "active-tour", previous: activeTour, next: tour });
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
            this.activeTour = index >= 0 ? this.tours.getAt(index) : null;
        }

        return true;
    }

    createTour()
    {
        const tour = new Tour();
        this.tours.append(tour);

        this.updateTourList();
        this.activeTour = tour;
    }

    deleteTour()
    {
        const tours = this.tours;

        const index = tours.getIndexOf(this.activeTour);
        tours.removeAt(index);

        this.updateTourList();
        this.activeTour = index < tours.length ? tours[index] : tours[index - 1];
    }

    moveTourUp()
    {
        this.tours.moveItem(this.activeTour, -1);
        this.updateTourList();
    }

    moveTourDown()
    {
        this.tours.moveItem(this.activeTour, 1);
        this.updateTourList();
    }

    addTarget(component: Component, property: Property)
    {
        this._defaultTargets.push({ id: component.id, key: property.key });
    }

    fromData(tours: ITour[])
    {
        this.tours.items = tours.map(tourData => Tour.fromJSON(tourData));
    }

    toData(): ITour[]
    {
        return this.tours.items.map(tour => tour.toJSON());
    }

    protected updateTourList()
    {
        const names = this.tours.items.map(tour => tour.data.title);
        names.unshift("(none)");
        this.ins.tour.setOptions(names);

        this.emit("update");
    }
}