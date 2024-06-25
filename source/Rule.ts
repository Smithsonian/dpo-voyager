/**
 * FF Typescript Foundation Library
 * Copyright 2019 Ralph Wiedemeier, Frame Factory GmbH
 *
 * License: MIT
 */

import StateMachine from "./StateMachine";
import State from "./State";
import Transition from "./Transition";

////////////////////////////////////////////////////////////////////////////////

enum ECondition { Always, Never, Idle, Targeted }

export default class Rule
{
    machine: StateMachine;
    events: Set<string>;
    condition: ECondition;
    state: State;
    transition: Transition;
    speed: number;

    get backward() {
        return this.transition && this.transition.toState === this.state;
    }

    test(event: string)
    {
        if (!this.events.has(event)) {
            return false;
        }

        switch(this.condition) {
            case ECondition.Always:
                return true;

            case ECondition.Never:
                return false;

            case ECondition.Idle:
                return this.machine.activeState === this.state;

            case ECondition.Targeted:
                return this.machine.activeState
        }
    }

    execute()
    {

    }
}