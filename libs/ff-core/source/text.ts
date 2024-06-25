/**
 * FF Typescript Foundation Library
 * Copyright 2019 Ralph Wiedemeier, Frame Factory GmbH
 *
 * License: MIT
 */

export function camelize(text: string)
{
    return text.replace(/(?:^\w|[A-Z]|\b\w)/g, (letter, index) =>
        index == 0 ? letter.toLowerCase() : letter.toUpperCase()
    ).replace(/\s+/g, '');
}

export function normalize(text: string)
{
    return text.replace(/([A-Z])/g, ' $1')
        .replace(/^./, str => str.toUpperCase());
}