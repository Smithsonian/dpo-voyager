/**
 * FF Typescript Foundation Library
 * Copyright 2019 Ralph Wiedemeier, Frame Factory GmbH
 *
 * License: MIT
 */

import Property from "./Property";
import { getConversionFunction, getElementCopyFunction, getMultiCopyFunction } from "./convert";

////////////////////////////////////////////////////////////////////////////////

type ConversionFunction = (inVal: any, outVal: any) => any;

export default class PropertyLink
{
    source: Property;
    destination: Property;

    sourceIndex: number | undefined;
    destinationIndex: number | undefined;

    protected fnConvert: ConversionFunction;
    protected fnCopy: (inVal: any, outVal: any, fnConvert: ConversionFunction) => any;

    constructor(source: Property, destination: Property, sourceIndex?: number, destinationIndex?: number)
    {
        if (source.elementCount === 1 && sourceIndex >= 0) {
            throw new Error("non-array source property; can't link to element");
        }
        if (destination.elementCount === 1 && destinationIndex >= 0) {
            throw new Error("non-array destination property; can't link to element");
        }

        this.source = source;
        this.destination = destination;

        this.sourceIndex = sourceIndex;
        this.destinationIndex = destinationIndex;

        const srcIndex = sourceIndex === undefined ? -1 : sourceIndex;
        const dstIndex = destinationIndex === undefined ? -1 : destinationIndex;
        const isArray = source.elementCount > 1 && srcIndex < 0 && dstIndex < 0;

        this.fnConvert = getConversionFunction(source.type, destination.type, isArray);
        const fnElementCopy = getElementCopyFunction(srcIndex, dstIndex, this.fnConvert);
        this.fnCopy = getMultiCopyFunction(source.isMulti(), destination.isMulti(), fnElementCopy);
    }

    push()
    {
        this.destination.setValue(this.fnCopy(this.source.value, this.destination.value, this.fnConvert));
    }
}