/**
 * FF Typescript Foundation Library
 * Copyright 2019 Ralph Wiedemeier, Frame Factory GmbH
 *
 * License: MIT
 */

import { normalize } from "./text";

////////////////////////////////////////////////////////////////////////////////

export interface ICommand
{
    readonly name: string;

    do: () => void;
    undo?: () => void;
    canDo: () => boolean;
    canUndo: () => boolean;
}

export interface ICommandProps<T extends Function>
{
    do: T,
    undo?: (state: {}) => void,
    canDo?: () => boolean,
    target: object,
    name?: string;
}

export default class Command<T extends Function = Function> implements ICommand
{
    private _props: ICommandProps<T>;
    private _args: any[];
    private _state: any;

    constructor(args: any[], props: ICommandProps<T>)
    {
        this._args = args;
        this._props = props;
        this._args = args;
        this._state = null;
    }

    get name() {
        return this._props.name || normalize(this._props.do.name);
    }

    do()
    {
        if (this._state) {
            throw new Error("undo should be called before execute can be applied again");
        }

        this._state = this._props.do.apply(this._props.target, this._args);
    }

    undo()
    {
        if (!this._props.undo) {
            throw new Error("can't undo this command");
        }
        if (!this._state) {
            throw new Error("execute should be called before undo can be applied");
        }

        this._props.undo.call(this._props.target, this._state);
        this._state = null;
    }

    canDo()
    {
        return this._props.canDo ? this._props.canDo() : true;
    }

    canUndo()
    {
        return !!this._props.undo;
    }
}

