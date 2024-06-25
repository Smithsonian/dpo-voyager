/**
 * FF Typescript Foundation Library
 * Copyright 2019 Ralph Wiedemeier, Frame Factory GmbH
 *
 * License: MIT
 */

import Vector2, { IVector2 } from "./Vector2";

////////////////////////////////////////////////////////////////////////////////

export interface IBox2
{
    min: IVector2;
    max: IVector2;
}

export default class Box2 implements IBox2
{
    min: Vector2;
    max: Vector2;

    constructor(minX?: number, minY?: number, maxX?: number, maxY?: number)
    {
        this.min = new Vector2(minX, minY);
        this.max = new Vector2(maxX, maxY);
    }

    set(minX: number, minY: number, maxX: number, maxY: number)
    {
        this.min.set(minX, minY);
        this.max.set(maxX, maxY);

        return this;
    }

    setFromPoints(min: IVector2, max: IVector2)
    {
        this.min.copy(min);
        this.max.copy(max);

        return this;
    }

    setEmpty()
    {
        this.min.set(Infinity, Infinity);
        this.max.set(-Infinity, -Infinity);

        return this;
    }

    isEmpty(): boolean
    {
        return !(isFinite(this.max.x - this.min.x)
            && isFinite(this.max.y - this.min.y));
    }

    uniteWith(other: IBox2)
    {
        const p0 = this.min, p1 = this.max;

        p0.set(Math.min(p0.x, other.min.x), Math.min(p0.y, other.min.y));
        p1.set(Math.max(p1.x, other.max.x), Math.max(p1.y, other.max.y));

        return this;
    }

    intersectWith(other: IBox2)
    {
        const min = this.min, max = this.max;

        min.set(Math.max(min.x, other.min.x), Math.max(min.y, other.min.y));
        max.set(Math.min(max.x, other.max.x), Math.min(max.y, other.max.y));

        return this;
    }

    include(x: number, y: number)
    {
        const min = this.min, max = this.max;

        min.x = Math.min(min.x, x);
        min.y = Math.min(min.y, y);

        max.x = Math.max(max.x, x);
        max.y = Math.max(max.y, y);

        return this;
    }

    includePoint(point: IVector2)
    {
        const min = this.min, max = this.max;

        min.x = Math.min(min.x, point.x);
        min.y = Math.min(min.y, point.y);

        max.x = Math.max(max.x, point.x);
        max.y = Math.max(max.y, point.y);

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

        return this;
    }
}