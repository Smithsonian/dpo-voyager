/**
 * FF Typescript Foundation Library
 * Copyright 2019 Ralph Wiedemeier, Frame Factory GmbH
 *
 * License: MIT
 */

import Vector3, { IVector3 } from "./Vector3";

////////////////////////////////////////////////////////////////////////////////

export interface IVector4
{
    x: number;
    y: number;
    z: number;
    w: number;
}

/**
 * 4-dimensional vector.
 */
export default class Vector4
{
    static readonly zeros = new Vector4(0, 0, 0, 0);
    static readonly ones = new Vector4(1, 1, 1, 1);
    static readonly unitX = new Vector4(1, 0, 0, 0);
    static readonly unitY = new Vector4(0, 1, 0, 0);
    static readonly unitZ = new Vector4(0, 0, 1, 0);
    static readonly unitW = new Vector4(0, 0, 0, 1);

    /**
     * Returns a new vector with all components set to zero: [0, 0, 0, 0].
     */
    static makeZeros(): Vector4
    {
        return new Vector4(0, 0, 0, 0);
    }

    /**
     * Returns a new vector with all components set to one: [1, 1, 1, 1].
     */
    static makeOnes(): Vector4
    {
        return new Vector4(1, 1, 1, 1);
    }

    /**
     * Returns a new unit-length vector, parallel to the X axis: [1, 0, 0, 0].
     */
    static makeUnitX(): Vector4
    {
        return new Vector4(1, 0, 0, 0);
    }

    /**
     * Returns a new unit-length vector, parallel to the Y axis: [0, 1, 0, 0].
     */
    static makeUnitY(): Vector4
    {
        return new Vector4(0, 1, 0, 0);
    }

    /**
     * Returns a new unit-length vector, parallel to the Z axis: [0, 0, 1, 0].
     */
    static makeUnitZ(): Vector4
    {
        return new Vector4(0, 0, 1, 0);
    }

    /**
     * Returns a new unit-length vector, parallel to the W axis: [0, 0, 0, 1].
     */
    static makeUnitW(): Vector4
    {
        return new Vector4(0, 0, 0, 1);
    }

    /**
     * Returns a new vector with components set from the given vector.
     * @param vector
     */
    static makeCopy(vector: IVector4)
    {
        return new Vector4(vector.x, vector.y, vector.z, vector.w);
    }

    /**
     * Returns a new vector with each component set to the given scalar value.
     * @param scalar
     */
    static makeFromScalar(scalar: number)
    {
        return new Vector4(scalar, scalar, scalar, scalar);
    }

    /**
     * Returns a new vector with components set from the values of the given array.
     * @param array
     */
    static makeFromArray(array: number[]): Vector4
    {
        return new Vector4(array[0], array[1], array[2], array[3]);
    }

    /**
     * Returns a new positional vector from the given [[Vector3]].
     * Copies the components of the given vector to x, y, z and sets w to 1.
     * @param position
     */
    static makeFromPosition(position: IVector3): Vector4
    {
        return new Vector4(position.x, position.y, position.z, 1);
    }

    /**
     * Returns a new directional vector from the given [[Vector3]].
     * Copies the components of the given vector to x, y, z and sets w to 0.
     * @param direction
     */
    static makeFromDirection(direction: IVector3): Vector4
    {
        return new Vector4(direction.x, direction.y, direction.z, 0);
    }

    /**
     * Returns a string representation of the given vector.
     * @param vector
     */
    static toString(vector: IVector4)
    {
        return `[${vector.x}, ${vector.y}, ${vector.z}, ${vector.w}]`;
    }

    /** The vector's x component. */
    x: number;
    /** The vector's y component. */
    y: number;
    /** The vector's z component. */
    z: number;
    /** The vector's w component. */
    w: number;


    /**
     * Constructs a new vector with the given x, y, z, and w values.
     * Omitted or invalid values are set to zero.
     * @param x
     * @param y
     * @param z
     * @param w
     */
    constructor(x?: number, y?: number, z?: number, w?: number)
    {
        this.x = x || 0;
        this.y = y || 0;
        this.z = z || 0;
        this.w = w || 0;
    }

    /**
     * Copies the components of the given vector to this.
     * @param vector
     */
    copy(vector: IVector4): Vector4
    {
        this.x = vector.x;
        this.y = vector.y;
        this.z = vector.z;
        this.w = vector.w;
        return this;
    }

    /**
     * Sets the components of this to the given values.
     * @param x
     * @param y
     * @param z
     * @param w Optional, is set to one if omitted.
     */
    set(x: number, y: number, z: number, w?: number): Vector4
    {
        this.x = x;
        this.y = y;
        this.z = z;
        this.w = w === undefined ? 1 : w;
        return this;
    }

    /**
     * Sets each component to the given scalar value.
     * @param scalar
     */
    setFromScalar(scalar: number): Vector4
    {
        this.x = scalar;
        this.y = scalar;
        this.z = scalar;
        this.w = scalar;
        return this;
    }

    /**
     * Sets the components to the values of the given array.
     * @param array
     * @param offset Optional start index of the array. Default is 0.
     */
    setFromArray(array: number[], offset: number = 1): Vector4
    {
        this.x = array[offset];
        this.y = array[offset + 1];
        this.z = array[offset + 2];
        this.w = array[offset + 3];
        return this;
    }

    /**
     * Sets this to a positional vector by copying the values of the given [[Vector3]]
     * and adding one as fourth component.
     * @param position
     */
    setPosition(position: IVector3): Vector4
    {
        this.x = position.x;
        this.y = position.y;
        this.z = position.z;
        this.w = 1;
        return this;
    }

    /**
     * Sets this to a positional vector by copying the values of the given [[Vector3]]
     * and adding zero as fourth component.
     * @param direction
     */
    setDirection(direction: IVector3): Vector4
    {
        this.x = direction.x;
        this.y = direction.y;
        this.z = direction.z;
        this.w = 0;
        return this;
    }

    /**
     * Sets all components to zero.
     */
    setZeros(): Vector4
    {
        this.x = 0;
        this.y = 0;
        this.z = 0;
        this.w = 0;
        return this;
    }

    /**
     * Sets all components to one.
     */
    setOnes(): Vector4
    {
        this.x = 1;
        this.y = 1;
        this.z = 1;
        this.w = 1;
        return this;
    }

    /**
     * Makes this a unit vector parallel to the X axis.
     */
    setUnitX(): Vector4
    {
        this.x = 1;
        this.y = 0;
        this.z = 0;
        this.w = 0;
        return this;
    }

    /**
     * Makes this a unit vector parallel to the Y axis.
     */
    setUnitY(): Vector4
    {
        this.x = 0;
        this.y = 1;
        this.z = 0;
        this.w = 0;
        return this;
    }

    /**
     * Makes this a unit vector parallel to the Z axis.
     */
    setUnitZ(): Vector4
    {
        this.x = 0;
        this.y = 0;
        this.z = 1;
        this.w = 0;
        return this;
    }

    /**
     * Makes this a unit vector parallel to the W axis.
     */
    setUnitW(): Vector4
    {
        this.x = 0;
        this.y = 0;
        this.z = 0;
        this.w = 1;
        return this;
    }

    /**
     * Adds the given vector to this.
     * @param other
     */
    add(other: IVector4): Vector4
    {
        this.x += other.x;
        this.y += other.y;
        this.z += other.z;
        this.w += other.w;
        return this;
    }

    /**
     * Subtracts the given vector from this.
     * @param other
     */
    sub(other: IVector4): Vector4
    {
        this.x -= other.x;
        this.y -= other.y;
        this.z -= other.z;
        this.w -= other.w;
        return this;
    }

    /**
     * Multiplies each component with the corresponding component of the given vector.
     * @param other
     */
    mul(other: IVector4): Vector4
    {
        this.x *= other.x;
        this.y *= other.y;
        this.z *= other.z;
        this.w *= other.w;
        return this;
    }

    /**
     * Divides each component by the corresponding component of the given vector.
     * @param other
     */
    div(other: IVector4): Vector4
    {
        this.x /= other.x;
        this.y /= other.y;
        this.z /= other.z;
        this.w /= other.w;
        return this;
    }

    /**
     * Normalizes the vector, making it a unit vector.
     */
    normalize(): Vector4
    {
        const f = 1 / Math.sqrt(this.x * this.x + this.y * this.y + this.z * this.z + this.w * this.w);
        this.x *= f;
        this.y *= f;
        this.z *= f;
        this.w *= f;
        return this;
    }

    /**
     * Makes this vector homogeneous by dividing all components by the w-component.
     */
    homogenize(): Vector4
    {
        this.x /= this.w;
        this.y /= this.w;
        this.z /= this.w;
        this.w = 1;
        return this;
    }

    /**
     * Projects this onto the given vector.
     * @param other
     */
    project(other: IVector4): Vector4
    {
        //TODO: Verify
        const f = this.dot(other) / this.lengthSquared();
        this.x *= f;
        this.y *= f;
        this.z *= f;
        this.w *= f;
        return this;
    }

    /**
     * Returns the dot product of this and the given vector.
     * @param other
     */
    dot(other: IVector4): number
    {
        return this.x * other.x + this.y * other.y + this.z * other.z + this.w * other.w;
    }

    /**
     * Returns the 2-norm (length) of this.
     */
    length(): number
    {
        const x = this.x, y = this.y, z = this.z, w = this.w;
        return Math.sqrt(x * x + y * y + z * z + w * w);
    }

    /**
     * Returns the squared 2-norm of this, i.e. the dot product of the vector with itself.
     */
    lengthSquared(): number
    {
        const x = this.x, y = this.y, z = this.z, w = this.w;
        return x * x + y * y + z * z + w * w;
    }

    /**
     * Returns true if all components are exactly zero.
     * @returns {boolean}
     */
    isZero(): boolean
    {
        return this.x === 0 && this.y === 0 && this.z === 0 && this.w === 0;
    }

    /**
     * Returns a clone of this vector.
     */
    clone(): Vector4
    {
        return new Vector4(this.x, this.y, this.z, this.w);
    }

    /**
     * Returns an array with the components of this.
     * @param array Optional destination array.
     * @param offset Optional start index of the array. Default is 0.
     */
    toArray(array?: number[], offset?: number): number[]
    {
        if (array) {
            if (offset === undefined) {
                offset = 0;
            }

            array[offset] = this.x;
            array[offset + 1] = this.y;
            array[offset + 2] = this.z;
            array[offset + 3] = this.w;
            return array;
        }

        return [
            this.x,
            this.y,
            this.z,
            this.w
        ];
    }

    /**
     * Returns a [[Vector3]] with the x, y, and z components of this.
     * @param vector Optional destination vector.
     */
    toVector3(vector?: Vector3): Vector3
    {
        if (vector) {
            vector.x = this.x;
            vector.y = this.y;
            vector.z = this.z;
            return vector;
        }

        return new Vector3(this.x, this.y, this.z);
    }

    /**
     * Returns a text representation.
     */
    toString()
    {
        return Vector4.toString(this);
    }
}