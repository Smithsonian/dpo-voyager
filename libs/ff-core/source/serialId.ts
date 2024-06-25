/**
 * FF Typescript Foundation Library
 * Copyright 2019 Ralph Wiedemeier, Frame Factory GmbH
 *
 * License: MIT
 */

let _id = 0;

/**
 * Returns a serial number which is unique during the current execution of the program.
 * @returns {number} Unique serial number.
 */
export default function serialId()
{
    return ++_id;
}