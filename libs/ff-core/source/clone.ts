/**
 * FF Typescript Foundation Library
 * Copyright 2019 Ralph Wiedemeier, Frame Factory GmbH
 *
 * License: MIT
 */

/**
 * Returns a deep clone of the given object. Handles plain objects, arrays, typed arrays,
 * dates, functions. Custom objects with default constructors are copied as well, without warranty.
 * Functions are copied by reference only.
 * @param source {any} The source object.
 * @returns {any} A deep clone of the source object.
 */
export default function clone<T>(source: T): T
{
    // null, undefined, primitive values and functions
    if (source === null || typeof(source) !== "object") {
        return source;
    }

    let copy: any;

    // standard arrays
    if (Array.isArray(source)) {
        copy = [];
        for (let i = 0, n = source.length; i < n; ++i) {
            copy[i] = clone(source[i]);
        }

        return copy;
    }

    // typed arrays
    if ((source as any).BYTES_PER_ELEMENT !== undefined) {
        return (source as any).slice();
    }

    // date
    if (source instanceof Date) {
        return new Date(source) as any;
    }

    // plain objects
    if (source.constructor === Object) {
        copy = {};
        for (let key in source) {
            if (source.hasOwnProperty(key)) {
                copy[key] = clone(source[key]);
            }
        }

        return copy;
    }

    // objects with custom constructors: return a reference
    return source;
}