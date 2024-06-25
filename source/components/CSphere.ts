/**
 * FF Typescript Foundation Library
 * Copyright 2019 Ralph Wiedemeier, Frame Factory GmbH
 *
 * License: MIT
 */

import { SphereBufferGeometry, MathUtils } from "three";

import{ types } from "@ff/graph/propertyTypes";

import CGeometry from "./CGeometry";

////////////////////////////////////////////////////////////////////////////////

export default class CSphere extends CGeometry
{
    static readonly typeName: string = "CSphere";

    protected static readonly sphereIns = {
        radius: types.Number("Sphere.Radius", 10),
        phi: types.Vector2("Sphere.Phi", [ 0, 360 ]),
        theta: types.Vector2("Sphere.Theta", [ 0, 360 ]),
        segments: types.Vector2("Sphere.Segments", [ 32, 32 ])
    };

    ins = this.addInputs(CSphere.sphereIns);

    update()
    {
        const { radius, phi, theta, segments } = this.ins;
        const D2R = MathUtils.DEG2RAD;

        this.geometry = new SphereBufferGeometry(
            radius.value,
            segments.value[0], segments.value[1],
            phi.value[0] * D2R, phi.value[1] * D2R,
            theta.value[0] * D2R, theta.value[1] * D2R
        );

        return true;
    }
}