/**
 * FF Typescript Foundation Library
 * Copyright 2020 Ralph Wiedemeier, Frame Factory GmbH
 *
 * License: MIT
 */

import {
    Vector3,
    Matrix4,
} from "three";

import math from "./math";

////////////////////////////////////////////////////////////////////////////////

export interface IDeltaOrbitManip
{
    dX: number;
    dY: number;
    dScale: number;
    dPitch: number;
    dHead: number;
    dRoll: number;
}

export default class OrbitController
{
    readonly orientation = new Vector3();
    readonly offset = new Vector3();
    size: number = 50;

    orientationEnabled: boolean;
    orthographicMode: boolean;

    protected viewportWidth: number;
    protected viewportHeight: number;


    constructor(orthographicMode: boolean = false)
    {
        this.orientationEnabled = true;
        this.orthographicMode = orthographicMode;

        this.viewportWidth = 100;
        this.viewportHeight = 100;
    }

    update(delta?: IDeltaOrbitManip): boolean
    {
        if (!delta) {
            return false;
        }

        const { orientation, offset } = this;

        if (this.orientationEnabled) {
            orientation.x += delta.dPitch * 300 / this.viewportHeight;
            orientation.y += delta.dHead * 300 / this.viewportHeight;
            orientation.z += delta.dRoll * 300 / this.viewportHeight;
        }

        let factor;

        if (this.orthographicMode) {
            factor = this.size = Math.max(this.size, 0.1) * delta.dScale;
        }
        else {
            factor = this.offset.z = Math.max(this.offset.z, 0.1) * delta.dScale;
        }

        offset.x -= delta.dX * factor / this.viewportHeight;
        offset.y += delta.dY * factor / this.viewportHeight;
    }

    toMatrix(matOut?: Matrix4): Matrix4
    {
        matOut = matOut || new Matrix4();
        math.composeOrbitMatrix(this.orientation, this.offset, matOut);
        return matOut;
    }

    fromMatrix(mat: Matrix4)
    {
        math.decomposeOrbitMatrix(mat, this.orientation, this.offset);
    }

    setViewportSize(width: number, height: number)
    {
        this.viewportWidth = width;
        this.viewportHeight = height;
    }
}