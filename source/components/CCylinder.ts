/**
 * FF Typescript Foundation Library
 * Copyright 2019 Ralph Wiedemeier, Frame Factory GmbH
 *
 * License: MIT
 */

import { CylinderBufferGeometry, MathUtils } from "three";

import{ types } from "@ff/graph/propertyTypes";

import CGeometry from "./CGeometry";

////////////////////////////////////////////////////////////////////////////////

export default class CCylinder extends CGeometry
{
    static readonly typeName: string = "CCylinder";

    protected static readonly cylinderIns = {
        radiusTop: types.Number("TopRadius", 5),
        radiusBottom: types.Number("BottomRadius", 5),
        height: types.Number("Height", 10),
        open: types.Boolean("OpenEnded"),
        theta: types.Vector2("Theta", [ 0, 360 ]),
        segments: types.Vector2("Segments", [ 12, 1 ])
    };

    ins = this.addInputs(CCylinder.cylinderIns);

    update()
    {
        const { radiusTop, radiusBottom, height, open, theta, segments } = this.ins;
        const D2R = MathUtils.DEG2RAD;

        this.geometry = new CylinderBufferGeometry(
            radiusTop.value, radiusBottom.value,
            height.value,
            segments.value[0], segments.value[1],
            open.value,
            theta.value[0] * D2R, theta.value[1] * D2R
        );

        return true;
    }
}