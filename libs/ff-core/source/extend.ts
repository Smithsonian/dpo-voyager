/**
 * FF Typescript Foundation Library
 * Copyright 2019 Ralph Wiedemeier, Frame Factory GmbH
 *
 * License: MIT
 */

export default function extend(derivedClass: any, baseClass: any)
{
    // create prototype chain
    let derivedPrototype = Object.create(baseClass.prototype);
    derivedPrototype.constructor = derivedClass;
    derivedClass.prototype = derivedPrototype;

    // copy static properties
    Object.getOwnPropertyNames(baseClass).forEach(property => {
        derivedClass[property] = baseClass[property];
    });
}