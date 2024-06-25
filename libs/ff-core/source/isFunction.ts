/**
 * FF Typescript Foundation Library
 * Copyright 2019 Ralph Wiedemeier, Frame Factory GmbH
 *
 * License: MIT
 */

export default function isFunction(obj: any): boolean
{
    return !!(obj && obj.constructor && obj.call && obj.apply);
}