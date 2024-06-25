/**
 * FF Typescript Foundation Library
 * Copyright 2019 Ralph Wiedemeier, Frame Factory GmbH
 *
 * License: MIT
 */

import CustomElement, { customElement, property } from "./CustomElement";

////////////////////////////////////////////////////////////////////////////////

@customElement("ff-dial")
export default class Dial extends CustomElement
{
    @property({ type: Number })
    value = 0;

    protected firstConnected()
    {
        this.classList.add("ff-control ff-dial");
    }
}

