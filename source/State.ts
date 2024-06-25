/**
 * FF Typescript Foundation Library
 * Copyright 2019 Ralph Wiedemeier, Frame Factory GmbH
 *
 * License: MIT
 */

import StateMachine from "./StateMachine";
import Rule from "./Rule";

////////////////////////////////////////////////////////////////////////////////

export default class State
{
    rules: Set<Rule>;

    readonly machine: StateMachine;

    constructor(machine: StateMachine)
    {
        this.rules = new Set();
        this.machine = machine;
    }
}