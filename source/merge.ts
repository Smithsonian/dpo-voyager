/**
 * FF Typescript Foundation Library
 * Copyright 2019 Ralph Wiedemeier, Frame Factory GmbH
 *
 * License: MIT
 */

export default function merge<T, S>(objA: T, objB: S): T & S
{
    let result: any = {};

    if (objA !== undefined) {
        if (typeof objA !== "object") {
            throw TypeError("argument 1 is not an object");
        }

        for (let key in objA) {
            if (objA.hasOwnProperty(key)) {
                result[key] = objA[key];
            }
        }
    }

    if (objB !== undefined) {
        if (typeof objB !== "object") {
            throw TypeError("argument 2 is not an object");
        }

        for (let key in objB) {
            if (objB.hasOwnProperty(key)) {
                result[key] = objB[key];
            }
        }
    }

    return result;
}