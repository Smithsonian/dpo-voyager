/**
 * FF Typescript Foundation Library
 * Copyright 2019 Ralph Wiedemeier, Frame Factory GmbH
 *
 * License: MIT
 */

export interface ISortedArrayItem<T>
{
    key: number;
    value: T;
}

/**
 * Binary sorted array, providing fast insert and retrieval.
 * The sortable property must be of type number, the property name can be specified
 * in the constructor. The default name of the sortable property is "value".
 */
export default class SortedArray<T>
{
    readonly items: ISortedArrayItem<T>[];

    constructor()
    {
        this.items = [];
    }

    get length()
    {
        return this.items.length;
    }

    get values(): T[]
    {
        const values: T[] = [];
        const items = this.items;
        for (let i = 0, n = items.length; i < n; ++i) {
            values.push(items[i].value);
        }
        return values;
    }

    clear()
    {
        this.items.length = 0;
    }

    empty(): boolean
    {
        return !this.items.length;
    }

    itemAtBefore(key: number)
    {
        const index = this.indexAtBefore(key);
        return index < 0 ? undefined : this.items[index];
    }

    insertItem(item: ISortedArrayItem<T>)
    {
        const i = this.indexAtBefore(item.key);
        this.items.splice(i + 1, 0, item);
    }

    insertAt(key: number, value: T)
    {
        const i = this.indexAtBefore(key);
        this.items.splice(i + 1, 0, { key, value });
    }

    removeItem(item: ISortedArrayItem<T>)
    {
        return this.removeAt(item.key);
    }

    removeAt(key: number)
    {
        const i = this.indexAt(key);
        if (i < 0) {
            return false;
        }

        this.items.splice(i, 1);
        return true;
    }

    /**
     * Removes items between begin (inclusive) and end (exclusive).
     * @param {number} begin
     * @param {number} end
     */
    removeBetween(begin: number, end: number): ISortedArrayItem<T>[]
    {
        const items = this.items;
        let startIndex = this.indexAtBefore(begin);

        if (startIndex < 0 || (startIndex < items.length && items[startIndex].key < begin)) {
            startIndex++;
        }

        let endIndex = this.indexAtBefore(end);

        if (endIndex < 0 || (endIndex < items.length && items[endIndex].key === end)) {
            endIndex--;
        }

        return items.splice(startIndex, endIndex - startIndex + 1);
    }

    findItem(item: ISortedArrayItem<T>)
    {
        return this.findAt(item.key);
    }

    /**
     * Returns the item whose key is equal to the given key.
     * @param {number} key
     * @returns {T} item with given value or null if not found.
     */
    findAt(key: number): ISortedArrayItem<T>
    {
        const items = this.items;

        let lb = 0;
        let ub = items.length - 1;
        let i = 0;

        while(ub >= lb) {
            i = Math.floor((ub + lb) * 0.5);
            const item = items[i];
            const k = item.key;
            if (k < key) {
                lb = i + 1;
            }
            else if (k > key) {
                ub = i - 1;
            }
            else {
                return item;
            }
        }

        return null;
    }

    /**
     * Returns the index of the element whose value matches the given value.
     * @param {number} key
     * @returns {number} Index of an element of the items array, -1 if not found.
     */
    indexAt(key: number)
    {
        const items = this.items;

        let lb = 0;
        let ub = items.length - 1;
        let i = 0;

        while(ub >= lb) {
            i = Math.floor((ub + lb) * 0.5);
            const k = items[i].key;
            if (k < key) {
                lb = i + 1;
            }
            else if (k > key) {
                ub = i - 1;
            }
            else {
                return i;
            }
        }

        return -1;
    }

    /**
     * Returns the index of the element whose value is less or equal the given value.
     * @param {number} key
     * @returns {number} Index of an element of the items array.
     */
    indexAtBefore(key: number)
    {
        const items = this.items;

        let lb = 0;
        let ub = items.length - 1;
        let i = 0;

        while(ub >= lb) {
            i = Math.floor((ub + lb) * 0.5);
            const v = items[i].key;
            if (v < key) {
                lb = i + 1;
            }
            else if (v > key) {
                ub = i - 1;
            }
            else {
                return i;
            }
        }

        return lb - 1;
    }
}