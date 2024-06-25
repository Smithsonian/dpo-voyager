/**
 * FF Typescript Foundation Library
 * Copyright 2019 Ralph Wiedemeier, Frame Factory GmbH
 *
 * License: MIT
 */

import NHierarchy from "@ff/graph/nodes/NHierarchy";
import CTransform from "../components/CTransform";

////////////////////////////////////////////////////////////////////////////////

export default class NTransform extends NHierarchy
{
    static readonly typeName: string = "NTransform";

    get transform() {
        return this.getComponent(CTransform);
    }

    createComponents()
    {
        this.createComponent(CTransform);
    }


}