/**
 * FF Typescript Foundation Library
 * Copyright 2019 Ralph Wiedemeier, Frame Factory GmbH
 *
 * License: MIT
 */

import { EEasingCurve, getEasingFunction } from "@ff/core/easing";

import { types } from "../propertyTypes";
import { IPulseContext } from "./CPulse";
import Component from "../Component";

////////////////////////////////////////////////////////////////////////////////

const offsetSchema = { preset: 0, min: 0, max: 1, bar: true };

export enum ETimeBase { Relative, Absolute }
export enum EInterpolationMode { Forward, Backward, Alternate }


export default class COscillator extends Component
{
    static readonly typeName: string = "COscillator";

    protected static readonly oscIns = {
        run: types.Boolean("Control.Run"),
        start: types.Event("Control.Start"),
        pause: types.Event("Control.Pause"),
        stop: types.Event("Control.Stop"),
        min: types.Number("Value.Min"),
        max: types.Number("Value.Max", 1),
        curve: types.Enum("Interpolation.Curve", EEasingCurve),
        mode: types.Enum("Interpolation.Mode", EInterpolationMode),
        duration: types.Number("Time.Duration", 1),
        base: types.Enum("Time.Base", ETimeBase),
        offset: types.Number("Time.Offset", offsetSchema),
        repetitions: types.Natural("Time.Repetitions"),
    };

    protected static readonly oscOuts = {
        value: types.Number("Value"),
        repetition: types.Natural("Repetition"),
        repeat: types.Event("Repeat"),
    };

    ins = this.addInputs(COscillator.oscIns);
    outs = this.addOutputs(COscillator.oscOuts);

    protected lastTime: number = 0;
    protected lastT = 0;
    protected easingFunction: (t: number) => number = null;
    protected isAbsolute = false;
    protected isBackward = false;
    protected isAlternate = false;

    update(pulse: IPulseContext)
    {
        const { ins, outs } = this;

        if (ins.curve.changed) {
            this.easingFunction = getEasingFunction(ins.curve.getValidatedValue());
        }
        if (ins.mode.changed) {
            this.isBackward = ins.mode.value === EInterpolationMode.Backward;
            this.isAlternate = ins.mode.value === EInterpolationMode.Alternate;
        }
        if (ins.base.changed) {
            this.isAbsolute = ins.base.value === ETimeBase.Absolute;
        }

        if (ins.start.changed) {
            this.lastTime = 0;
            ins.run.setValue(true);
            outs.repetition.setValue(0);
        }
        else if (ins.pause.changed) {
            if (ins.run.value) {
                ins.run.setValue(false);
            }
            else if (ins.repetitions.value <= 0 || outs.repetition.value < ins.repetitions.value) {
                ins.run.setValue(true);
            }
        }
        else if (ins.stop.changed) {
            this.lastTime = 0;
            ins.run.setValue(false);
            outs.value.setValue(this.isBackward ? ins.max.value : ins.min.value);
            outs.repetition.setValue(0);
        }

        if (ins.run.changed && ins.run.value) {
            this.lastT = 0;
            if (ins.repetitions.value > 0 && outs.repetition.value >= ins.repetitions.value) {
                outs.repetition.setValue(0);
            }
        }

        return false;
    }

    tick(pulse: IPulseContext)
    {
        const { ins, outs } = this;

        if (ins.run.value) {
            const duration = ins.duration.value;
            if (duration === 0) {
                return false;
            }

            // absolute/relative base
            let t;
            if (this.isAbsolute) {
                t = pulse.secondsElapsed / duration;
            }
            else {
                t = this.lastTime = this.lastTime + pulse.secondsDelta / duration;
            }

            // modulo cycle
            t = t < 0 ? 1 - (-t % 1) : t % 1;

            // repetitions
            if (t < this.lastT) {
                const repetition = outs.repetition.value + 1;
                outs.repetition.setValue(repetition);
                outs.repeat.set();
                if (ins.repetitions.value > 0 && repetition >= ins.repetitions.value) {
                    ins.run.setValue(false);
                    t = 1;
                }
            }
            this.lastT = t;

            // offset
            t = t + ins.offset.value;
            t = t > 1 ? t % 1 : t;

            // alternate, easing curve
            t = this.isAlternate ? (t > 0.5 ? 1 - t : t) * 2 : (this.isBackward ? 1 - t : t);
            const v = ins.min.value + this.easingFunction(t) * (ins.max.value - ins.min.value);

            outs.value.setValue(v);
            return true;
        }

        return false;
    }
}