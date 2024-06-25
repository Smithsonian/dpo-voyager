/**
 * FF Typescript Foundation Library
 * Copyright 2019 Ralph Wiedemeier, Frame Factory GmbH
 *
 * License: MIT
 */

import NTransform from "./NTransform";
import CLight from "../components/CLight";

////////////////////////////////////////////////////////////////////////////////

export default class NLight extends NTransform
{
    static readonly typeName: string = "NLight";

    get light() {
        return this.getComponent(CLight);
    }
}