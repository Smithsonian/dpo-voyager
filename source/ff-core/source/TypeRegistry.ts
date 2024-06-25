/**
 * FF Typescript Foundation Library
 * Copyright 2019 Ralph Wiedemeier, Frame Factory GmbH
 *
 * License: MIT
 */

import { Dictionary, Type } from "./types";
import Publisher, { ITypedEvent } from "./Publisher";

////////////////////////////////////////////////////////////////////////////////


export interface ITypeEvent extends ITypedEvent<"type">
{
    add: boolean;
    remove: boolean;
    classType: Type;
}

export default class TypeRegistry extends Publisher
{
    protected _dict: Dictionary<Type> = {};

    constructor()
    {
        super();
        this.addEvent("type");
    }

    add(type: Type | Type[])
    {
        if (Array.isArray(type)) {
            type.forEach(type => this.add(type));
            return;
        }

        const typeName = (type as any).typeName;
        if (!typeName) {
            throw new Error("type must have a 'typeName' member");
        }

        if (this._dict[typeName]) {
            throw new Error(`type '${typeName}' already registered`);
        }

        this._dict[typeName] = type;
        this.emit<ITypeEvent>({ type: "type", add: true, remove: false, classType: type });
    }

    remove(type: Type | Type[])
    {
        if (Array.isArray(type)) {
            type.forEach(type => this.remove(type));
            return;
        }

        const typeName = (type as any).typeName;
        if (!typeName) {
            throw new Error("type must have a 'typeName' member");
        }

        if (!this._dict[typeName]) {
            throw new Error(`type '${typeName}' not registered`);
        }

        delete this._dict[typeName];
        this.emit<ITypeEvent>({ type: "type", add: false, remove: true, classType: type });
    }

    getType(typeHint: string | object | Type): Type | undefined
    {
        let typeName = typeHint as string;

        if (typeof typeHint === "function") {
            typeName = (typeHint as any).typeName;
        }
        else if (typeof typeHint === "object") {
            typeName = (typeHint.constructor as any).typeName;
        }

        return this._dict[typeName];
    }

    createInstance(typeHint: string | object | Type, ...args)
    {
        const type = this.getType(typeHint);
        if (!type) {
            throw new Error(`type '${typeHint}' not registered`);
        }

        return new type(...args);
    }
}