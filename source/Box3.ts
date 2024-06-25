/**
 * FF Typescript Foundation Library
 * Copyright 2019 Ralph Wiedemeier, Frame Factory GmbH
 *
 * License: MIT
 */

import Vector3, { IVector3 } from "./Vector3";

////////////////////////////////////////////////////////////////////////////////

export interface IBox3
{
    min: IVector3;
    max: IVector3;
}

export default class Box3 implements IBox3
{
    min: Vector3;
    max: Vector3;

    constructor(minX?: number, minY?: number, minZ?: number, maxX?: number, maxY?: number, maxZ?: number)
    {
        this.min = new Vector3(minX, minY, minZ);
        this.max = new Vector3(maxX, maxY, maxZ);
    }

    set(minX: number, minY: number, minZ: number, maxX: number, maxY: number, maxZ: number)
    {
        this.min.set(minX, minY, minZ);
        this.max.set(maxX, maxY, maxZ);

        return this;
    }

    setFromPoints(min: IVector3, max: IVector3)
    {
        this.min.copy(min);
        this.max.copy(max);

        return this;
    }

    setEmpty()
    {
        this.min.set(Infinity, Infinity, Infinity);
        this.max.set(-Infinity, -Infinity, -Infinity);

        return this;
    }

    isEmpty(): boolean
    {
        return !(isFinite(this.max.x - this.min.x)
            && isFinite(this.max.y - this.min.y)
            && isFinite(this.max.z - this.min.z));
    }

    uniteWith(other: IBox3)
    {
        const p0 = this.min, p1 = this.max;

        p0.set(Math.min(p0.x, other.min.x), Math.min(p0.y, other.min.y), Math.min(p0.z, other.min.z));
        p1.set(Math.max(p1.x, other.max.x), Math.max(p1.y, other.max.y), Math.max(p1.z, other.max.z));

        return this;
    }

    intersectWith(other: IBox3)
    {
        const min = this.min, max = this.max;

        min.set(Math.max(min.x, other.min.x), Math.max(min.y, other.min.y), Math.max(min.z, other.min.z));
        max.set(Math.min(max.x, other.max.x), Math.min(max.y, other.max.y), Math.min(max.z, other.max.z));

        return this;
    }

    include(x: number, y: number, z: number)
    {
        const min = this.min, max = this.max;

        min.x = Math.min(min.x, x);
        min.y = Math.min(min.y, y);
        min.z = Math.min(min.z, z);

        max.x = Math.max(max.x, x);
        max.y = Math.max(max.y, y);
        max.z = Math.max(max.z, z);

        return this;
    }

    includePoint(point: IVector3)
    {
        const min = this.min, max = this.max;

        min.x = Math.min(min.x, point.x);
        min.y = Math.min(min.y, point.y);
        min.z = Math.min(min.z, point.z);

        max.x = Math.max(max.x, point.x);
        max.y = Math.max(max.y, point.y);
        max.z = Math.max(max.z, point.z);

        return this;
    }

    normalize()
    {
        const min = this.min, max = this.max;

        if (min.x > max.x) {
            const t = min.x; min.x = max.x; max.x = t;
        }
        if (min.y > max.y) {
            const t = min.y; min.y = max.y; max.y = t;
        }
        if (min.z > max.z) {
            const t = min.z; min.z = max.z; max.z = t;
        }

        return this;
    }
}