/**
 * FF Typescript Foundation Library
 * Copyright 2019 Ralph Wiedemeier, Frame Factory GmbH
 *
 * License: MIT
 */

import math from "./math";
import AnimationTrack, { IKey, IKeyPair } from "./AnimationTrack";

////////////////////////////////////////////////////////////////////////////////

export enum InterpolationType {
    Hold,
    Linear,
    Spline,
    Ease,
    EaseIn,
    EaseOut
}

export interface ISplineKey extends IKey<number>
{
    type: InterpolationType;

    leftTime?: number;
    leftValue?: number;

    rightTime?: number;
    rightValue?: number;
}

export interface ISplineKeyPair extends IKeyPair<ISplineKey>
{
}

export default class SplineTrack extends AnimationTrack<number, ISplineKey>
{
    interval: ISplineKeyPair;

    constructor()
    {
        super();

        this.defaultValue = 0;

        this.interval = {
            left: null,
            right: null
        };
    }

    insert(time: number, value: number, type: InterpolationType = InterpolationType.Ease)
    {
        this.insertKey({
            time,
            value,
            type
        });
    }

    valueAt(time: number)
    {
        let interval = this.interval;

        if (!this.keys.items.length) {
            return this.defaultValue;
        }

        if (this.changed) {
            this.changed = false;
            this.keysAround(time, interval);
        }

        if ((interval.left && time < interval.left.time)
            || (interval.right && time >= interval.right.time))
        {
            this.keysAround(time, interval);
        }

        //console.log(time, interval);

        const leftKey = interval.left,
              rightKey = interval.right;

        if (!leftKey) {
            return rightKey.value;
        }
        if (!rightKey || leftKey.type === InterpolationType.Hold) {
            return leftKey.value;
        }

        const leftTime = leftKey.time,
            leftValue = leftKey.value,
            rightTime = rightKey.time,
            rightValue = rightKey.value,
            deltaTime = rightTime - leftTime,
            deltaValue = rightValue - leftValue;

        let t = (time - leftTime) / deltaTime;

        switch (leftKey.type) {
            case InterpolationType.Linear:
                return leftValue + t * deltaValue;

            case InterpolationType.Ease:
                //t = t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
                t = Math.cos(t * math.PI - math.PI) * 0.5 + 0.5;
                return leftValue + t * deltaValue;

            case InterpolationType.EaseIn:
                //t = t * t;
                t = Math.sin(t * math.HALF_PI);
                return leftValue + t * deltaValue;

            case InterpolationType.EaseOut:
                //t = t * (2 - t);
                t = Math.cos(t * math.HALF_PI - math.PI) + 1.0;
                return leftValue + t * deltaValue;

            case InterpolationType.Spline:
                const MIN_TIME = 1e-4,
                      MAX_TIME = 1 - MIN_TIME;

                let t0 = 0,
                    t1 = leftKey.rightTime / deltaTime,
                    t2 = (rightKey.leftTime + deltaTime) / deltaTime,
                    t3 = 1;

                t1 = t1 < MIN_TIME ? MIN_TIME : (t1 > MAX_TIME ? MAX_TIME : t1);
                t2 = t2 < MIN_TIME ? MIN_TIME : (t2 > MAX_TIME ? MAX_TIME : t2);

                let tc1 = 3 * (t1 - t0),
                    tc2 = 3 * t0 - 6 * t1 + 3 * t2,
                    tc3 = -t0 + 3 * (t1 - t2) + t3;

                let tc33 = tc3 * 3,
                    tc22 = tc2 * 2,
                    tc00 = t0 - t;

                let v1 = leftValue + leftKey.rightValue,
                    v2 = rightValue + rightKey.leftValue;

                let vc0 = leftValue,
                    vc1 = 3 * (v1 - leftValue),
                    vc2 = 3 * leftValue - 6 * v1 + 3 * v2,
                    vc3 = -leftValue + 3 * (v1 - v2) + rightValue;

                // horner-scheme evaluation
                for (let i = 0; i < 14; ++i) {
                    let f = t * (t * (t * tc3  + tc2 ) + tc1) + tc00;
                    let df = t * (t * tc33 + tc22) + tc1;
                    t = t - f / df;
                }

                return t * (t * (t * vc3 + vc2) + vc1) + vc0;
        }
    }
}