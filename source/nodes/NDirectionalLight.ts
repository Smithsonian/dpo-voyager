/**
 * FF Typescript Foundation Library
 * Copyright 2019 Ralph Wiedemeier, Frame Factory GmbH
 *
 * License: MIT
 */

import NLight from "./NLight";
import CDirectionalLight from "../components/CDirectionalLight";

////////////////////////////////////////////////////////////////////////////////

export default class NDirectionalLight extends NLight
{
    static readonly typeName: string = "NDirectionalLight";

    get light() {
        return this.getComponent(CDirectionalLight);
    }

    createComponents()
    {
        super.createComponents();
        this.createComponent(CDirectionalLight);
    }
}