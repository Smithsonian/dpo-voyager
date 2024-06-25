/**
 * FF Typescript Foundation Library
 * Copyright 2019 Ralph Wiedemeier, Frame Factory GmbH
 *
 * License: MIT
 */

/**
 * Returns an object containing source properties which are also present in the template object.
 * Template properties not present in the source object are copied over from the template.
 * If matchType is true, source properties also must have the same type as their corresponding
 * properties in the template, otherwise the template properties are copied. Operation is performed
 * recursively (deep conform).
 * @param {any} source The source object
 * @param {T} template The template object
 * @param {boolean} matchTypes If true, types of properties must match
 * @returns {T} The resulting object, conforming to the template.
 */
export default function conform<T>(source: any, template: T, matchTypes: boolean = true): T
{
    const sourceType = typeof source;

    if (matchTypes && sourceType !== typeof template) {
        return template;
    }

    if (sourceType !== "object") {
        return source;
    }

    if (source === null) {
        return null;
    }

    // Arrays
    if (Array.isArray(source)) {

        const result: any = [];

        if (Array.isArray(template) && template.length > 0) {
            const tElem = template[0];

            if (matchTypes) {
                const tElemType = typeof tElem;

                for (let i = 0, n = source.length; i < n; ++i) {
                    if (typeof source[i] === tElemType) {
                        const element = conform(source[i], template[0], matchTypes);
                        if (element !== undefined) {
                            result.push(source[i]);
                        }
                    }
                }
                return result;
            }

            for (let i = 0, n = source.length; i < n; ++i) {
                result.push(conform(source[i], tElem, matchTypes));
            }

            return result;
        }

        return source.slice(0) as any;
    }

    // Objects
    const result: any = {};

    for (let key in template) {
        if (template.hasOwnProperty(key)) {
            result[key] = conform(source[key] as any, template[key] as any, matchTypes);
        }
    }

    return result;
}