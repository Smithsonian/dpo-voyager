/**
 * FF Typescript Foundation Library
 * Copyright 2019 Ralph Wiedemeier, Frame Factory GmbH
 *
 * License: MIT
 */

import CustomElement, { customElement, property } from "./CustomElement";

////////////////////////////////////////////////////////////////////////////////

export type FieldType = "number" | "boolean" | "string" | "object";

@customElement("ff-field-edit")
export default class FieldEdit<T = number> extends CustomElement
{
    @property({ type: String })
    type: FieldType = "number";

    @property({ type: String })
    preset: string = "";

    @property({ type: Number })
    min: number = undefined;

    @property({ type: Number })
    max: number = undefined;

    @property({ type: Number })
    step: number = undefined;

    @property({ type: Number })
    precision: number = undefined;

    @property({ type: Boolean })
    bar: boolean = false;

    @property({ type: Boolean })
    percent: boolean = false;


    constructor()
    {
        super();
    }

    get value(): T
    {
        return undefined;
    }

    set value(value: T)
    {

    }
}