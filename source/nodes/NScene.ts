/**
 * FF Typescript Foundation Library
 * Copyright 2019 Ralph Wiedemeier, Frame Factory GmbH
 *
 * License: MIT
 */

import NTransform from "./NTransform";
import CScene from "../components/CScene";

////////////////////////////////////////////////////////////////////////////////

export default class NScene extends NTransform
{
    static readonly typeName: string = "NScene";

    get scene() {
        return this.getComponent(CScene);
    }

    createComponents()
    {
        this.createComponent(CScene);
    }
}