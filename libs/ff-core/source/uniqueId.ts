/**
 * FF Typescript Foundation Library
 * Copyright 2019 Ralph Wiedemeier, Frame Factory GmbH
 *
 * License: MIT
 */

let _chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

/**
 * Creates a base64 encoded globally unique identifier with a default length of 12 characters.
 * The identifier only uses letters and digits and can safely be used for file names.
 * Unique combinations: 62 ^ 12 > 2 ^ 64
 * @param length Number of base64 characters in the identifier.
 * @param dictionary Optional object with ids. Function ensures generated id is not equal to a key of dictionary.
 * @returns Globally unique identifier
 */
export default function uniqueId(length?: number, dictionary?: {})
{
    if (!length || typeof length !== "number") {
        length = 12;
    }

    let id;

    do {
        id = "";
        for (let i = 0; i < length; ++i) {
            id += _chars[Math.random() * 62 | 0];
        }
    } while(dictionary && dictionary[id]);

    return id;
}