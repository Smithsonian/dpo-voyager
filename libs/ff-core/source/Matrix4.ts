/**
 * FF Typescript Foundation Library
 * Copyright 2019 Ralph Wiedemeier, Frame Factory GmbH
 *
 * License: MIT
 */

import Vector3, { IVector3 } from "./Vector3";
import Vector4, { IVector4 } from "./Vector4";
import Quaternion, { IQuaternion } from "./Quaternion";

////////////////////////////////////////////////////////////////////////////////

export enum ERotationOrder { XYZ, YXZ, ZXY, ZYX, YZX, XZY }

export interface IMatrix4
{
    elements: Float32Array;
}

/**
 * 4 by 4 matrix.
 */
export default class Matrix4
{
    static readonly zeros = new Matrix4().setZeros();
    static readonly ones = new Matrix4().setOnes();
    static readonly identity = new Matrix4();

    /**
     * Returns a new matrix with all elements set to zero.
     */
    static makeZeros(): Matrix4
    {
        return new Matrix4().setZeros();
    }

    /**
     * Returns a new matrix with all elements set to one.
     */
    static makeOnes(): Matrix4
    {
        return new Matrix4().setOnes();
    }

    /**
     * Returns a new matrix set to the identity matrix.
     */
    static makeIdentity(): Matrix4
    {
        return new Matrix4();
    }

    /**
     * Returns a text representation of the given matrix.
     * @param matrix
     */
    static toString(matrix: IMatrix4)
    {
        const e = matrix.elements;
        return `[${e[0]}, ${e[4]}, ${e[8]}, ${e[12]}]\n[${e[1]}, ${e[5]}, ${e[9]}, ${e[13]}]\n[${e[2]}, ${e[6]}, ${e[10]}, ${e[14]}]\n[${e[3]}, ${e[7]}, ${e[11]}, ${e[15]}]`;
    }

    /** The matrix' elements in column major order. */
    elements: Float32Array;

    /**
     * Constructs a new 4 by 4 identity matrix.
     * @param elements Optional initial values.
     */
    constructor(elements?: ArrayLike<number>)
    {
        if (elements) {
            this.elements = new Float32Array(elements);
            if (this.elements.length !== 16) {
                throw new Error("array length mismatch: must be 16");
            }
        }
        else {
            const e = this.elements = new Float32Array(16);
            e[0] = e[5] = e[10] = e[15] = 1;
        }
    }

    /**
     * Copies the elements of the given matrix to this.
     * @param matrix
     */
    copy(matrix: IMatrix4): Matrix4
    {
        this.elements.set(matrix.elements, 0);
        return this;
    }

    /**
     * Sets the elements of this to the given values.
     * @param e00
     * @param e01
     * @param e02
     * @param e03
     * @param e10
     * @param e11
     * @param e12
     * @param e13
     * @param e20
     * @param e21
     * @param e22
     * @param e23
     * @param e30
     * @param e31
     * @param e32
     * @param e33
     */
    set(e00, e01, e02, e03, e10, e11, e12, e13, e20, e21, e22, e23, e30, e31, e32, e33): Matrix4
    {
        const e = this.elements;
        e[0]  = e00; e[1]  = e10; e[2]  = e20; e[3]  = e30;
        e[4]  = e01; e[5]  = e11; e[6]  = e21; e[7]  = e31;
        e[8]  = e02; e[9]  = e12; e[10] = e22; e[11] = e32;
        e[12] = e03; e[13] = e13; e[14] = e23; e[15] = e33;
        return this;
    }

    /**
     * Sets the elements to the values of the given array.
     * @param array
     * @param rowMajor If true, reads the array in row major order. Default is false.
     */
    setFromArray(array: number[], rowMajor: boolean = false): Matrix4
    {
        if (rowMajor) {
            const e = this.elements;
            e[0]  = array[0];  e[1]  = array[4]; e[2]  = array[8];  e[3]  = array[12];
            e[4]  = array[1];  e[5]  = array[5]; e[6]  = array[9];  e[7]  = array[13];
            e[8]  = array[2];  e[9]  = array[6]; e[10] = array[10]; e[11] = array[14];
            e[12] = array[3];  e[13] = array[7]; e[14] = array[11]; e[15] = array[15];
        }
        else {
            this.elements.set(array, 0);
        }
        return this;
    }

    /**
     * Sets all elements to zero.
     */
    setZeros(): Matrix4
    {
        const e = this.elements;
        e[0]  = 0; e[1]  = 0; e[2]  = 0; e[3]  = 0;
        e[4]  = 0; e[5]  = 0; e[6]  = 0; e[7]  = 0;
        e[8]  = 0; e[9]  = 0; e[10] = 0; e[11] = 0;
        e[12] = 0; e[13] = 0; e[14] = 0; e[15] = 0;
        return this;
    }

    /**
     * Sets all elements to one.
     */
    setOnes(): Matrix4
    {
        const e = this.elements;
        e[0]  = 1; e[1]  = 1; e[2]  = 1; e[3]  = 1;
        e[4]  = 1; e[5]  = 1; e[6]  = 1; e[7]  = 1;
        e[8]  = 1; e[9]  = 1; e[10] = 1; e[11] = 1;
        e[12] = 1; e[13] = 1; e[14] = 1; e[15] = 1;
        return this;
    }

    /**
     * Sets the identity matrix.
     */
    setIdentity(): Matrix4
    {
        const e = this.elements;
        e[0]  = 1; e[1]  = 0; e[2]  = 0; e[3]  = 0;
        e[4]  = 0; e[5]  = 1; e[6]  = 0; e[7]  = 0;
        e[8]  = 0; e[9]  = 0; e[10] = 1; e[11] = 0;
        e[12] = 0; e[13] = 0; e[14] = 0; e[15] = 1;
        return this;
    }

    /**
     * Transposes the matrix in-place.
     */
    transpose()
    {
        const e = this.elements;
        const t0 = e[4];  e[4]  = e[1];  e[1]  = t0;
        const t1 = e[8];  e[8]  = e[2];  e[2]  = t1;
        const t2 = e[12]; e[12] = e[3];  e[3]  = t2;
        const t3 = e[9];  e[9]  = e[6];  e[6]  = t3;
        const t4 = e[13]; e[13] = e[7];  e[7]  = t4;
        const t5 = e[14]; e[14] = e[11]; e[11] = t5;
        return this;
    }

    /**
     * Writes the basis vectors of the matrix to the given column vectors.
     * @param x Basis vector for the x axis.
     * @param y Basis vector for the y axis.
     * @param z Basis vector for the z axis.
     */
    getBasis(x: IVector3, y: IVector3, z: IVector3)
    {
        const e = this.elements;
        x.x = e[0]; x.y = e[1]; x.z = e[2];
        y.x = e[4]; y.y = e[5]; y.z = e[6];
        z.x = e[8]; z.y = e[9]; z.z = e[10];
        return this;
    }

    /**
     * Sets the basis vectors of the matrix from the given column vectors.
     * @param x Basis vector for the x axis.
     * @param y Basis vector for the y axis.
     * @param z Basis vector for the z axis.
     */
    setBasis(x: IVector3, y: IVector3, z: IVector3)
    {
        const e = this.elements;
        e[0] = x.x; e[1] = x.y; e[2] = x.z;
        e[4] = y.x; e[5] = y.y; e[6] = y.z;
        e[8] = z.x; e[9] = z.y; e[10] = z.z;
        return this;
    }

    /**
     * Sets the rotation part (upper 3 by 3 matrix) of this matrix
     * from the given matrix.
     * @param matrix Matrix to extract the rotation from.
     */
    setRotationFromMatrix(matrix: IMatrix4)
    {
        const e = this.elements;
        const m = matrix.elements;

        const xx = m[0], xy = m[1], xz = m[2];
        const sx = 1 / Math.sqrt(xx * xx + xy * xy + xz * xz);
        const yx = m[4], yy = m[5], yz = m[6];
        const sy = 1 / Math.sqrt(yx * yx + yy * yy + yz * yz);
        const zx = m[8], zy = m[9], zz = m[10];
        const sz = 1 / Math.sqrt(zx * zx + zy * zy + zz * zz);

        e[0] = m[0] * sx; e[1] = m[1] * sx; e[2] = m[2] * sx;
        e[4] = m[4] * sy; e[5] = m[5] * sy; e[6] = m[2] * sy;
        e[8] = m[8] * sz; e[9] = m[9] * sz; e[10] = m[10] * sz;

        e[3] = e[7] = e[11] = e[12] = e[13] = e[14] = 0;
        e[15] = 1;

        return this;
    }

    setRotationX(angleX: number)
    {
        // TODO: Implement
        return this;
    }

    setRotationY(angleY: number)
    {
        // TODO: Implement
        return this;
    }

    setRotationZ(angleZ: number)
    {
        // TODO: Implement
        return this;
    }

    setRotation(ax: number, ay: number, az: number, order: ERotationOrder)
    {
        const e = this.elements;
        const sinX = Math.sin(ax), cosX = Math.cos(ax);
        const sinY = Math.sin(ay), cosY = Math.cos(ay);
        const sinZ = Math.sin(az), cosZ = Math.cos(az);

        switch(order) {
            case ERotationOrder.XYZ:
                e[0] = 0;
                e[4] = 0;
                e[8] = 0;
                e[1] = 0;
                e[5] = 0;
                e[9] = 0;
                e[2] = 0;
                e[6] = 0;
                e[10] = 0;
                break;

            case ERotationOrder.XZY:
                e[0] = 0;
                e[4] = 0;
                e[8] = 0;
                e[1] = 0;
                e[5] = 0;
                e[9] = 0;
                e[2] = 0;
                e[6] = 0;
                e[10] = 0;
                break;

            case ERotationOrder.YXZ:
                e[0] = 0;
                e[4] = 0;
                e[8] = 0;
                e[1] = 0;
                e[5] = 0;
                e[9] = 0;
                e[2] = 0;
                e[6] = 0;
                e[10] = 0;
                break;

            case ERotationOrder.YZX:
                e[0] = 0;
                e[4] = 0;
                e[8] = 0;
                e[1] = 0;
                e[5] = 0;
                e[9] = 0;
                e[2] = 0;
                e[6] = 0;
                e[10] = 0;
                break;

            case ERotationOrder.ZXY:
                e[0] = 0;
                e[4] = 0;
                e[8] = 0;
                e[1] = 0;
                e[5] = 0;
                e[9] = 0;
                e[2] = 0;
                e[6] = 0;
                e[10] = 0;
                break;

            case ERotationOrder.ZYX:
                e[0] = 0;
                e[4] = 0;
                e[8] = 0;
                e[1] = 0;
                e[5] = 0;
                e[9] = 0;
                e[2] = 0;
                e[6] = 0;
                e[10] = 0;
                break;
        }

        e[3] = e[7] = e[11] = e[12] = e[13] = e[14] = 0;
        e[15] = 1;

        return this;
    }

    setRotationFromVector(angles: IVector3, order: ERotationOrder)
    {
        return this.setRotation(angles.x, angles.y, angles.y, order);
    }

    /**
     * Sets the rotation part (upper 3 by 3 matrix) of this matrix
     * from the given quaternion.
     * @param quat
     */
    setRotationFromQuaternion(quat: IQuaternion)
    {
        // TODO: Implement
        return this;
    }

    setTranslation(tx: number, ty: number, tz: number)
    {
        const e = this.elements;
        e[0]  = 1;  e[1]  = 0;  e[2]  = 0;  e[3]  = 0;
        e[4]  = 0;  e[5]  = 1;  e[6]  = 0;  e[7]  = 0;
        e[8]  = 0;  e[9]  = 0;  e[10] = 1;  e[11] = 0;
        e[12] = tx; e[13] = ty; e[14] = tz; e[15] = 1;
        return this;
    }

    setTranslationFromVector(translation: IVector3)
    {
        return this.setTranslation(translation.x, translation.y, translation.z);
    }

    setScale(sx: number, sy: number, sz: number)
    {
        const e = this.elements;
        e[0]  = sx; e[1]  = 0;  e[2]  = 0;  e[3]  = 0;
        e[4]  = 0;  e[5]  = sy; e[6]  = 0;  e[7]  = 0;
        e[8]  = 0;  e[9]  = 0;  e[10] = sz; e[11] = 0;
        e[12] = 0;  e[13] = 0;  e[14] = 0;  e[15] = 1;
        return this;
    }

    setScaleFromVector(scale: IVector3)
    {
        return this.setScale(scale.x, scale.y, scale.z);
    }

    /**
     * Returns a clone of this matrix.
     */
    clone()
    {
        return new Matrix4(this.elements);
    }

    /**
     * Returns an array with the elements of this matrix.
     * @param array Optional destination array.
     * @param rowMajor If true, writes the array in row major order. Default is false.
     */
    toArray(array?: number[], rowMajor: boolean = false): number[]
    {
        if (!array) {
            array = [ 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0 ];
        }

        const e = this.elements;

        if (rowMajor) {
            array[0] = e[0];  array[4] = e[1];  array[8]  = e[2];  array[12] = e[3];
            array[1] = e[4];  array[5] = e[5];  array[9]  = e[6];  array[13] = e[7];
            array[2] = e[8];  array[6] = e[9];  array[10] = e[10]; array[14] = e[11];
            array[3] = e[12]; array[7] = e[13]; array[11] = e[14]; array[15] = e[15];
        }
        else {
            array[0]  = e[0];  array[1]  = e[1];  array[2]  = e[2];  array[3]  = e[3];
            array[4]  = e[4];  array[5]  = e[5];  array[6]  = e[6];  array[7]  = e[7];
            array[8]  = e[8];  array[9]  = e[9];  array[10] = e[10]; array[11] = e[11];
            array[12] = e[12]; array[13] = e[13]; array[14] = e[14]; array[15] = e[15];
        }

        return array;
    }

    /**
     * Returns a typed array with the elements of this matrix.
     * @param array Optional destination array.
     */
    toTypedArray(array?: Float32Array): Float32Array
    {
        if (array) {
            array.set(this.elements, 0);
            return array;
        }

        return new Float32Array(this.elements);
    }

    /**
     * Returns a text representation of this matrix.
     */
    toString()
    {
        return Matrix4.toString(this);
    }
}