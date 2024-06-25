/**
 * FF Typescript Foundation Library
 * Copyright 2019 Ralph Wiedemeier, Frame Factory GmbH
 *
 * License: MIT
 */

import { BoxBufferGeometry } from "three";

import { types } from "@ff/graph/propertyTypes";

import CGeometry from "./CGeometry";

////////////////////////////////////////////////////////////////////////////////

export default class CBox extends CGeometry
{
    static readonly typeName: string = "CBox";

    protected static readonly boxIns = {
        size: types.Vector3("Box.Size", [ 10, 10, 10 ]),
        segments: types.Vector3("Box.Segments", [ 1, 1, 1])
    };

    ins = this.addInputs(CBox.boxIns);

    update()
    {
        const { size, segments } = this.ins;

        this.geometry = new BoxBufferGeometry(
            size.value[0], size.value[1], size.value[2],
            segments.value[0], segments.value[1], segments.value[2]
        );

        return true;
    }
}