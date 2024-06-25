/**
 * FF Typescript Foundation Library
 * Copyright 2019 Ralph Wiedemeier, Frame Factory GmbH
 *
 * License: MIT
 */

import State from "./State";
import Rule from "./Rule";
import PropertyTrack from "./PropertyTrack";

////////////////////////////////////////////////////////////////////////////////

export default class Transition
{
    rules: Set<Rule>;

    readonly fromState: State;
    readonly toState: State;

    private _tracks: PropertyTrack[];
    private _duration: number;

    constructor(fromState: State, toState: State)
    {
        this.rules = new Set();

        this.fromState = fromState;
        this.toState = toState;
    }

    get duration() {
        return this._duration;
    }

    evaluateAt(time: number)
    {
        const tracks = this._tracks;
        for (let i = 0, n = tracks.length; i < n; ++i) {
            tracks[i].evaluateAt(time);
        }
    }
}