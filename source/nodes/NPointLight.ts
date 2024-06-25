/**
 * FF Typescript Foundation Library
 * Copyright 2019 Ralph Wiedemeier, Frame Factory GmbH
 *
 * License: MIT
 */

import NLight from "./NLight";
import CPointLight from "../components/CPointLight";

////////////////////////////////////////////////////////////////////////////////

export default class NPointLight extends NLight
{
    static readonly typeName: string = "NPointLight";

    get light() {
        return this.getComponent(CPointLight);
    }

    createComponents()
    {
        super.createComponents();
        this.createComponent(CPointLight);
    }
}