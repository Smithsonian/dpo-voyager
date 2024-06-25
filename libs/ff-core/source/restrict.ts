/**
 * FF Typescript Foundation Library
 * Copyright 2019 Ralph Wiedemeier, Frame Factory GmbH
 *
 * License: MIT
 */

/**
 * Returns an object containing source properties which are also present in the template object.
 * Source properties not present in the template are not copied. The result is an object
 * whose properties are an intersection between source and template object.
 * @param {any} source The source object
 * @param {T} template The template object
 * @param {boolean} matchTypes If true, types of properties must match
 * @returns {Partial<T>} The resulting object, conforming to a partial of the template.
 */
export default function restrict<T>(source: any, template: T, matchTypes: boolean = true): Partial<T>
{
    if (typeof source !== "object" || source === null) {
        source = {};
    }

    if (typeof template !== "object") {
        throw TypeError("template must be of type object");
    }

    let result: any = {};

    for (let key in template) {
        if (template.hasOwnProperty(key) && source.hasOwnProperty(key)) {
            const templatePropType = typeof template[key];
            if (templatePropType === "object") {
                result[key] = restrict(source[key] as any, template[key] as any, matchTypes);
            }
            else if (!matchTypes || typeof source[key] === templatePropType) {
                result[key] = source[key];
            }
        }
    }

    return result as T;
}