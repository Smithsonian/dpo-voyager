/**
 * FF Typescript Foundation Library
 * Copyright 2019 Ralph Wiedemeier, Frame Factory GmbH
 *
 * License: MIT
 */

import SortedArray from "./SortedArray";

////////////////////////////////////////////////////////////////////////////////

export interface IKey<T = any>
{
    time: number;
    value: T;
}

export interface IKeyPair<K extends IKey>
{
    left: K;
    right: K;
}

/**
 * Base class for a track containing keyframes
 */
export default class AnimationTrack<T = any, K extends IKey<T> = IKey<T>>
{
    readonly keys: SortedArray<K>;

    protected defaultValue: T;
    protected changed: boolean;

    constructor()
    {
        this.keys = new SortedArray<K>();

        this.defaultValue = null;
        this.changed = true;
    }

    get length()
    {
        return this.keys.items.length;
    }

    empty()
    {
        return this.keys.empty();
    }

    setDefaultValue(value: T)
    {
        this.defaultValue = value;
    }

    insert(time: number, value: T)
    {
        this.insertKey({ time, value } as K);
    }

    insertKey(key: K)
    {
        this.changed = true;
        this.keys.insertAt(key.time, key);
    }

    removeKey(key: K): boolean
    {
        this.changed = true;
        return this.keys.removeAt(key.time);
    }

    removeKeyAt(time: number): boolean
    {
        this.changed = true;
        return this.keys.removeAt(time);
    }

    valueAt(time: number): T
    {
        const keys = this.keys;
        if (!keys.items.length) {
            return this.defaultValue;
        }

        const index = keys.indexAtBefore(time);

        const item = keys.items[index > 0 ? index : 0];
        return item ? item.value.value : this.defaultValue;
    }

    keysAround(time: number, result?: IKeyPair<K>)
    {
        const keys = this.keys;
        const index = keys.indexAtBefore(time);

        result = result || { left: null, right: null };

        const next = keys.items[index + 1];
        result.right = next ? next.value : null;
        result.left = index > -1 ? keys.items[index].value : null;

        return result;
    }

    leftKey(time: number)
    {
        const keys = this.keys;
        const index = keys.indexAtBefore(time);
        const item = index > -1 ? keys.items[index] : null;

        return item ? item.value : null;
    }
}
