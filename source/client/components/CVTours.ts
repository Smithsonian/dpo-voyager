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

import Component, { types } from "@ff/graph/Component";
import Property from "@ff/graph/Property";

import CTweenMachine, { IMachineState, ITweenTarget } from "@ff/graph/components/CTweenMachine";

import { ITours, ITour } from "common/types/setup";

////////////////////////////////////////////////////////////////////////////////

export enum EToursState { Off, Select, Playing }


export default class CVTours extends Component
{
    static readonly typeName: string = "CVTours";

    protected static readonly ins = {
        enabled: types.Boolean("Tours.Enabled"),
        index: types.Integer("Tours.Index", -1),
    };

    protected static readonly outs = {
        state: types.Enum("Tours.State", EToursState),
        index: types.Integer("Tours.Index", -1),
    };

    ins = this.addInputs(CVTours.ins);
    outs = this.addOutputs(CVTours.outs);

    private _tours: ITour[] = [];
    private _targets: ITweenTarget[] = [];

    get targets() {
        return this._targets;
    }
    get tours() {
        return this._tours;
    }
    get tweenMachine() {
        return this.getComponent(CTweenMachine);
    }

    create()
    {
        super.create();
        this.createComponent(CTweenMachine);
    }

    dispose()
    {
        super.dispose();
    }

    update()
    {
        const { ins, outs } = this;

        const isEnabled = ins.enabled.value;

        const tours = this._tours;
        const index = Math.min(tours.length - 1, Math.max(-1, ins.index.value));
        const indexChanged = index !== outs.index.value;

        if (indexChanged) {
            const currentTour = tours[outs.index.value];
            if (currentTour) {
                const state: IMachineState = this.tweenMachine.stateToJSON();
                currentTour.states = state.states;
            }
            const nextTour = tours[index];
            if (nextTour) {
                const state = { states: nextTour.states, targets: this._targets };
                this.tweenMachine.stateFromJSON(state);
            }
        }

        if (ins.enabled.changed || indexChanged) {
            outs.index.setValue(index);
            outs.state.setValue(isEnabled ? (index < 0 ? EToursState.Select : EToursState.Playing) : EToursState.Off);
        }

        return true;
    }

    addTarget(component: Component, property: Property)
    {
        this._targets.push({ id: component.id, key: property.key });
    }

    fromData(data: ITours)
    {
        this._targets = data.targets;

        this._tours = data.tours.map(tourData => ({
            states: tourData.states,
            title: tourData.title || "",
            lead: tourData.lead || "",
            tags: tourData.tags || [],
        }));

        this.ins.index.setValue(-1);
    }

    toData(): ITours | null
    {
        if (this._tours.length === 0) {
            return null;
        }

        // update current tour states before serialization
        const currentTour = this._tours[this.outs.index.value];
        if (currentTour) {
            const state: IMachineState = this.tweenMachine.stateToJSON();
            currentTour.states = state.states;
        }

        return {
            targets: this._targets,
            tours: this._tours.map(tour => {
                const data: ITour = {
                    states: tour.states,
                };

                if (tour.title) {
                    data.title = tour.title;
                }
                if (tour.lead) {
                    data.lead = tour.lead;
                }
                if (tour.tags.length > 0) {
                    data.tags = tour.tags.slice();
                }

                return data;
            })
        };
    }
}