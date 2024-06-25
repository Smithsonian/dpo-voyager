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

import { Dictionary } from "@ff/core/types";
import { getEasingFunction, EEasingCurve } from "@ff/core/easing";

import Component, { types } from "../Component";
import Property, { IPropertyDisposeEvent } from "../Property";
import { IPulseContext } from "./CPulse";
import uniqueId from "@ff/core/uniqueId";

////////////////////////////////////////////////////////////////////////////////

export { EEasingCurve };

export interface IMachineState
{
    states?: ITweenState[];
    targets?: ITweenTarget[];
}

export interface ITweenState
{
    id?: string;
    values: any[];
    curve: EEasingCurve;
    duration: number;
    threshold: number;
}

export interface ITweenTarget
{
    /** Target component id. */
    id: string;
    /** Target property key. */
    key: string;
}

export interface ITargetEntry
{
    property: Property;
    isNumber: boolean;
    isArray: boolean;
}

export default class CTweenMachine extends Component
{
    static readonly typeName: string = "CTweenMachine";

    protected static readonly ins = {
        id: types.String("Snapshot.Id"),
        curve: types.Enum("Tween.Curve", EEasingCurve),
        duration: types.Number("Tween.Duration", 2),
        threshold: types.Percent("Tween.Threshold", 0.5),
        tween: types.Event("Control.Tween"),
        recall: types.Event("Control.Recall"),
        store: types.Event("Control.Store"),
        delete: types.Event("Control.Delete"),
        clear: types.Event("Control.Clear"),
    };

    protected static readonly outs = {
        count: types.Integer("Snapshots.Count"),
        tweening: types.Boolean("Tween.IsTweening"),
        time: types.Number("Tween.Time"),
        completed: types.Percent("Tween.Completed"),
        switched: types.Boolean("Tween.Switched"),
        start: types.Event("Tween.Start"),
        switch: types.Event("Tween.Switch"),
        end: types.Event("Tween.End"),
    };

    ins = this.addInputs(CTweenMachine.ins);
    outs = this.addOutputs(CTweenMachine.outs);

    protected targets: ITargetEntry[] = [];
    protected states: Dictionary<ITweenState> = {};

    private _currentValues: any[] = null;
    private _targetState: ITweenState = null;
    private _startTime = 0;
    private _easingFunction = null;

    getState(id: string) {
        return this.states[id];
    }

    setState(state: ITweenState) {
        state.id = state.id || uniqueId(6);
        this.states[state.id] = state;
        return state.id;
    }

    deleteState(id: string) {
        delete this.states[id];
    }

    clear()
    {
        this.targets.forEach(target => target.property.off("dispose", this.onPropertyDispose, this));
        this.targets.length = 0;
        this.states = {};

        this._currentValues = null;
        this._targetState = null;
        this._startTime = 0;
        this._easingFunction = null;
    }

    dispose()
    {
        this.clear();
        super.dispose();
    }

    tweenTo(stateId: string, secondsElapsed: number)
    {
        const state = this.states[stateId];
        const outs = this.outs;

        if (state) {
            this._targetState = state;
            this._currentValues = this.getCurrentValues();
            this._startTime = secondsElapsed;
            this._easingFunction = getEasingFunction(state.curve);
            outs.switched.setValue(false);
            outs.tweening.setValue(true);
            outs.start.set();
            return true;
        }

    }

    update(context: IPulseContext)
    {
        const ins = this.ins;

        const states = this.states;
        const id = ins.id.value;
        const state = states[id];

        if (state) {
            if (ins.tween.changed || ins.recall.changed) {
                ins.curve.setValue(state.curve);
                ins.duration.setValue(state.duration);
                ins.threshold.setValue(state.threshold);
            }

            if (ins.tween.changed) {
                this.tweenTo(id, context.secondsElapsed);
                return true;
            }
            if (ins.recall.changed) {
                this.setValues(state.values);
                return true;
            }

            if (ins.curve.changed || ins.duration.changed || ins.threshold.changed) {
                state.curve = ins.curve.value;
                state.duration = ins.duration.value;
                state.threshold = ins.threshold.value;
            }
            if (ins.store.changed) {
                state.values = this.getCurrentValues();
            }
            if (ins.delete.changed) {
                delete states[id];
            }
        }
        else if (id && ins.store.changed) {
            const state: ITweenState = {
                id: this.ins.id.value,
                curve: this.ins.curve.getValidatedValue(),
                duration: this.ins.duration.value,
                threshold: this.ins.threshold.value,
                values: this.getCurrentValues(),
            };

            states[state.id] = state;
        }

        return true;
    }

    tick(context: IPulseContext)
    {
        const targetState = this._targetState;
        if (!targetState) {
            return false;
        }

        const outs = this.outs;

        const currentValues = this._currentValues;
        const startTime = this._startTime;
        const tweenTime = context.secondsElapsed - startTime;
        const tweenFactor = tweenTime / targetState.duration;

        if (tweenFactor < 1) {
            const easeFactor = this._easingFunction(tweenFactor);
            const shouldSwitch = tweenFactor >= targetState.threshold && !outs.switched.value;

            this.setValues(currentValues, targetState.values, easeFactor, shouldSwitch);

            outs.time.setValue(tweenTime);
            outs.completed.setValue(tweenFactor);
            if (shouldSwitch) {
                outs.switched.setValue(true);
                outs.switch.set();
            }
        }
        else {
            this.setValues(currentValues, targetState.values, 1, !outs.switched.value);

            outs.tweening.setValue(false);
            outs.time.setValue(targetState.duration);
            outs.completed.setValue(1);
            outs.end.set();

            if (!outs.switched.value) {
                outs.switched.setValue(true);
            }

            this._currentValues = null;
            this._targetState = null;
            this._startTime = 0;
            this._easingFunction = null;
        }

        return true;
    }

    addTargetProperty(property: Property)
    {
        if (property.type === "object" || property.schema.event) {
            throw new Error("can't add object or event properties");
        }

        if (this.getTarget(property)) {
            throw new Error("can't add, target already exists");
        }

        property.on<IPropertyDisposeEvent>("dispose", this.onPropertyDispose, this);

        const isNumber = property.type === "number" && !property.schema.options;
        const isArray = property.isArray();

        this.targets.push({ property, isNumber, isArray });

        const states = this.states;
        const keys = Object.keys(states);
        for (let i = 0, n = keys.length; i < n; ++i) {
            states[keys[i]].values.push(property.cloneValue());
        }
        if (this._currentValues) {
            this._currentValues.push(property.cloneValue());
        }
    }

    removeTargetProperty(property: Property)
    {
        const target = this.getTarget(property);

        if (!target) {
            throw new Error("can't remove, target doesn't exist");
        }

        this.removeTarget(target);
    }

    hasTargetProperty(property: Property)
    {
        return !!this.getTarget(property);
    }

    fromJSON(json: any)
    {
        super.fromJSON(json);

        if (json.state) {
            this.stateFromJSON(json.state);
        }
    }

    stateFromJSON(json: IMachineState)
    {
        if (json.targets) {
            this.targets = json.targets.map(jsonTarget => {
                const property = this.getProperty(jsonTarget.id, jsonTarget.key);
                return {
                    property,
                    isNumber: !!property && property.type === "number" && !property.schema.options,
                    isArray: !!property && property.isArray(),
                };
            });
        }
        if (json.states) {
            json.states.forEach(state => this.states[state.id] = state);
        }

        this._startTime = 0;
    }

    toJSON(): any
    {
        const json = super.toJSON();

        const state = this.stateToJSON();
        if (state) {
            json.state = state;
        }

        return json;
    }

    stateToJSON(): IMachineState
    {
        const json: IMachineState = {};

        const targets = this.targets;
        if (targets.length > 0) {
            json.targets = targets.map(target => ({
                id: target.property.group.linkable.id,
                key: target.property.key
            }));
        }

        const keys = Object.keys(this.states);
        if (keys.length > 0) {
            json.states = keys.map(key => this.states[key]);
        }

        return json;
    }

    getTargetProperties() {
        return this.targets.map(target => target.property);
    }

    protected onPropertyDispose(event: IPropertyDisposeEvent)
    {
        event.property.off<IPropertyDisposeEvent>("dispose", this.onPropertyDispose, this);

        const target = this.getTarget(event.property);
        this.removeTarget(target);
    }

    protected removeTarget(target: ITargetEntry)
    {
        const index = this.targets.indexOf(target);
        this.targets.splice(index, 1);
        this.removeChannel(index);
    }

    protected removeChannel(index: number)
    {
        const states = this.states;
        const keys = Object.keys(states);
        for (let i = 0, n = keys.length; i < n; ++i) {
            states[keys[i]].values.splice(index, 1);
        }
        if (this._currentValues) {
            this._currentValues.splice(index, 1);
        }
    }

    protected getTarget(property: Property)
    {
        return this.targets.find(target => target.property === property);
    }

    protected getProperty(componentId: string, propertyKey: string): Property | undefined
    {
        const component = this.system.components.getById(componentId);
        if (!component) {
            return null;
        }

        return component.ins[propertyKey];
    }

    protected setValues(valuesA: any[]);
    protected setValues(valuesA: any[], valuesB: any[], factor: number, doSwitch: boolean)
    protected setValues(valuesA: any[], valuesB?: any[], factor?: number, doSwitch?: boolean)
    {
        const targets = this.targets;

        for (let i = 0, n = targets.length; i < n; ++i) {
            const target = targets[i];
            const property = target.property;

            if (target.isNumber && valuesB && valuesB[i] !== null) {
                const vA = valuesA[i];
                const vB = valuesB[i];
                if (target.isArray) {
                    let changed = false;
                    for (let i = 0, n = vA.length; i < n; ++i) {
                        const v = vA[i] + factor * (vB[i] - vA[i]);
                        changed = property.value[i] !== v || changed;
                        property.value[i] = v;
                    }
                    if (changed) {
                        property.set();
                    }
                } else {
                    const v = vA + factor * (vB - vA);
                    if (v !== property.value) {
                        property.setValue(v);
                    }
                }
            }
            else if (!valuesB || doSwitch) {
                const value = valuesB && valuesB[i] !== null ? valuesB[i] : valuesA[i];

                if (target.isArray) {
                    let changed = false;
                    for (let i = 0, n = value.length; i < n; ++i) {
                        changed = property.value[i] !== value[i] || changed;
                        property.value[i] = value[i];
                    }
                    if (changed) {
                        property.set();
                    }
                }
                else if (value !== property.value) {
                    property.setValue(value);
                }
            }
        }
    }

    getCurrentValues(): any[]
    {
        const values = [];
        const targets = this.targets;
        for (let i = 0, n = targets.length; i < n; ++i) {
            values.push(targets[i].property.cloneValue());
        }

        return values;
    }
}