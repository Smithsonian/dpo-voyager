/**
 * FF Typescript Foundation Library
 * Copyright 2019 Ralph Wiedemeier, Frame Factory GmbH
 *
 * License: MIT
 */

/**
 * Simple mixin function, mixes properties of the source class(es) prototype(s)
 * into the target class prototype. Also copies static properties
 * (properties of the constructor function itself). Prints a warning to the console
 * if target properties are overridden.
 * @param targetClass constructor function of the target class.
 * @param {any | any[]} sourceClass A single mixin constructor or an array of mixin constructors.
 */
export default function mixin(targetClass: any, sourceClass: any | any[])
{
    // if sourceClass is an array, call mixin for each array element
    if (Array.isArray(sourceClass)) {
        sourceClass.forEach(sourceClass => {
            mixin(targetClass, sourceClass);
        });
    }
    else {
        // prototype properties (members)
        Object.getOwnPropertyNames(sourceClass.prototype).forEach(property => {
            if (targetClass.prototype[property]) {
                console.warn(`mixin - overriding member property '${property}'`);
            }
            targetClass.prototype[property] = sourceClass.prototype[property];
        });
        // constructor function properties (statics)
        Object.keys(sourceClass).forEach(key => {
            if (targetClass[key]) {
                console.warn(`mixin - overriding static property '${key}'`);
            }
            targetClass[key] = sourceClass[key];
        });
    }
}