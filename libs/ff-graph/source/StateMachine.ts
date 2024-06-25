/**
 * FF Typescript Foundation Library
 * Copyright 2019 Ralph Wiedemeier, Frame Factory GmbH
 *
 * License: MIT
 */

import Publisher from "@ff/core/Publisher";

import State from "./State";
import Transition from "./Transition";
import Rule from "./Rule";

////////////////////////////////////////////////////////////////////////////////

enum EMachineState { OnState, InTransition }

export default class StateMachine extends Publisher
{
    private _activeState: State;
    private _activeTransition: Transition;
    private _activeRule: Rule;

    private _currentTime: number;
    private _startTime: number;
    private _speed: number;
    private _backward: boolean;

    protected states: Set<State>;
    protected transitions: Set<Transition>;
    protected rules: Set<Rule>;

    constructor()
    {
        super();

        this._activeState = null;
        this._activeTransition = null;
        this._activeRule = null;

        this._currentTime = 0;
        this._startTime = 0;
        this._speed = 0;
        this._backward = false;

        this.states = new Set();
        this.transitions = new Set();
        this.rules = new Set();
    }

    get activeState() {
        return this._activeState;
    }
    get activeTransition() {
        return this._activeTransition;
    }
    get activeRule() {
        return this._activeRule;
    }
    get speed() {
        return this._speed;
    }
    get backward() {
        return this._backward;
    }

    evaluate(time: number)
    {
        this._currentTime = time;

        const transitionTime = (time - this._startTime) * this._speed;
    }

    triggerEvent(event: string)
    {
        if (this._activeState && this.testRules(this._activeState.rules, event)) {
            return;
        }
        if (this._activeTransition && this.testRules(this._activeTransition.rules, event)) {
            return;
        }

        return this.testRules(this.rules, event);
    }

    activateTransition(transition: Transition, speed: number, backward: boolean)
    {
        if (transition === this._activeTransition) {
            return;
        }

        this._activeState = null;
        this._activeTransition = transition;

        this._startTime = this._currentTime;
        this._speed = speed;
        this._backward = backward;
    }

    activateState(state: State)
    {
        if (state === this._activeState) {
            return;
        }

        this._activeState = state;
        this._activeTransition = null;

        this._startTime = 0;
        this._speed = 0;
        this._backward = false;
    }

    activateRule(rule: Rule)
    {
        this._activeRule = rule;

        if (rule.transition) {
            this.activateTransition(rule.transition, rule.speed, rule.backward);
        }
        else {
            this.activateState(rule.state);
        }
    }

    addState()
    {

    }

    addTransition(fromState: State, toState: State)
    {

    }

    protected testRules(rules: Set<Rule>, event: string)
    {
        for (let rule of rules) {
            if (rule.test(event)) {
                this.activateRule(rule);
                return true;
            }
        }

        return false;
    }

}

