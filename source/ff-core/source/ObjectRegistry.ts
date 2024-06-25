/**
 * FF Typescript Foundation Library
 * Copyright 2019 Ralph Wiedemeier, Frame Factory GmbH
 *
 * License: MIT
 */

import { Dictionary, TypeOf } from "./types";
import Publisher, { ITypedEvent } from "./Publisher";

////////////////////////////////////////////////////////////////////////////////

const _EMPTY_ARRAY = [];


export type ObjectOrTypeOrName<T extends object = object> = TypeOf<T> | T | string;

export interface IObjectEvent<T extends object = object> extends ITypedEvent<string>
{
    add: boolean;
    remove: boolean;
    object: T;
}

export interface ITagEvent<T extends object = object> extends ITypedEvent<string>
{
    add: boolean;
    remove: boolean;
    object: T;
    tag: string;
}

/**
 * Registry of object instances, grouped by their classes and base classes.
 */
export default class ObjectRegistry<T extends object> extends Publisher
{
    static getTypeName(scope: ObjectOrTypeOrName): string
    {
        return typeof scope === "function" ? (scope as any).typeName : (typeof scope === "object"
            ? (scope.constructor as any).typeName : scope);
    };

    protected _rootTypeName: string;

    protected _objLists: Dictionary<T[]>;
    protected _objTags: Dictionary<T[]>;
    protected _objDict: Dictionary<T>;

    constructor(rootType: TypeOf<T>)
    {
        super({ knownEvents: false });

        const typeName = (rootType as any).typeName;

        if (!typeName) {
            throw new Error("root type must have a 'typeName' member");
        }

        this._rootTypeName = typeName;

        this._objLists = { [this._rootTypeName]: [] };
        this._objTags = {};
        this._objDict = {};
    }

    /**
     * Adds an object to the registry. The object is registered under its actual class
     * and all base classes in its prototype chain. An [[IObjectEvent]] is emitted
     * for each class in the object's prototype chain.
     * @param object
     */
    add(object: T)
    {
        const id = (object as any).id;
        if (typeof id === "string") {

            if (this._objDict[id] !== undefined) {
                throw new Error("object already registered");
            }

            // add component to id dictionary
            this._objDict[id] = object;
        }

        let prototype: any = object;
        let typeName;
        const rootTypeName = this._rootTypeName;

        const event = { type: "", add: true, remove: false, object };

        // add all types in prototype chain
        do {
            prototype = Object.getPrototypeOf(prototype);
            typeName = prototype.constructor.typeName;

            if (typeName) {
                (this._objLists[typeName] || (this._objLists[typeName] = [])).push(object);

                event.type = typeName;
                this.emit<IObjectEvent>(event);
            }

        } while (typeName !== rootTypeName);
    }

    /**
     * Removes an object from the registry.
     * @param object
     */
    remove(object: T)
    {
        const id = (object as any).id;
        if (typeof id === "string") {

            if (this._objDict[id] !== object) {
                throw new Error("object not registered");
            }

            // remove component
            delete this._objDict[id];
        }

        let prototype: any = object;
        let typeName;
        const rootTypeName = this._rootTypeName;
        const event = { type: "", add: false, remove: true, object };

        // remove all types in prototype chain
        do {
            prototype = Object.getPrototypeOf(prototype);
            typeName = prototype.constructor.typeName;

            if (typeName) {
                event.type = typeName;

                const objects = this._objLists[typeName];
                objects.splice(objects.indexOf(object), 1);

                this.emit<IObjectEvent>(event);
            }

        } while (typeName !== rootTypeName);
    }

    /**
     * Registers an object with a given tag.
     * @param tag The tag name. Valid tag names are all non-empty strings except "tag".
     * @param object
     */
    addByTag(tag: string, object: T)
    {
        if (!tag || tag === "tag") {
            throw new Error("illegal tag name");
        }

        const list = this._objTags[tag] || (this._objTags[tag] = []);
        list.push(object);

        const event: ITagEvent = { type: "tag", add: true, remove: false, object, tag };
        this.emit<ITagEvent>(event);

        event.type = tag;
        this.emit<ITagEvent>(event);
    }

    /**
     * Unregisters an object with a given tag.
     * @param tag The tag name. Valid tag names are all non-empty strings except "tag".
     * @param object
     */
    removeByTag(tag: string, object: T): boolean
    {
        if (!tag || tag === "tag") {
            throw new Error("illegal tag name");
        }

        const list = this._objTags[tag];
        if (list) {
            const index = list.indexOf(object);
            if (index >= 0) {
                const event: ITagEvent = { type: "tag", add: false, remove: true, object, tag };
                this.emit<ITagEvent>(event);

                event.type = tag;
                this.emit(event);

                list.splice(index, 1);
                return true;
            }
        }

        return false;
    }

    /**
     * Removes all objects from the registry.
     */
    clear()
    {
        const objects = this.cloneArray();
        objects.forEach(object => this.remove(object));
    }

    /**
     * Returns the total number of objects in the registry.
     */
    get length() {
        return this._objLists[this._rootTypeName].length;
    }

    /**
     * Returns the number of objects (of a certain class or class name if given) in the registry.
     * @param scope Optional class or class name whose instances should be counted.
     */
    count(scope?: ObjectOrTypeOrName): number
    {
        const objects = this._objLists[this.getTypeName(scope)];
        return objects ? objects.length : 0;
    }

    /**
     * Returns true if the registry contains objects (of a given class or class name) or the given instance.
     * @param scope A class, class name, or an instance of a class.
     */
    has<U extends T>(scope: ObjectOrTypeOrName<U>): boolean
    {
        // scope is a constructor function
        if (typeof scope === "function") {
            const objects = this._objLists[(scope as any).typeName];
            return !!objects && objects.length > 0;
        }
        // scope is a string, i.e. a type name
        if (typeof scope === "string") {
            const objects = this._objLists[scope];
            return !!objects && objects.length > 0;
        }

        // scope is an object, search by its type name
        const objects = this._objLists[(scope.constructor as any).typeName];
        return objects && objects.indexOf(scope) >= 0;
    }

    /**
     * Returns true if the registry contains the given object.
     * @param object
     */
    contains<U extends T>(object: U): boolean
    {
        const id = (object as any).id;
        if (typeof id === "string") {
            return !!this._objDict[id];
        }

        const objects = this._objLists[(object.constructor as any).typeName];
        return objects && objects.indexOf(object) >= 0;
    }

    /**
     * Returns the first found instance of the given class or class name.
     * @param scope Class or class name of the instance to return.
     * @param nothrow If true, the method returns undefined if no instance was found.
     * By default, an error is thrown uf no instance is registered with the given class/class name.
     */
    get<U extends T = T>(scope?: ObjectOrTypeOrName<U>, nothrow: boolean = false): U | undefined
    {
        const className = this.getTypeName(scope);
        const objects = this._objLists[className];
        const object = objects ? objects[0] as U : undefined;

        if (!nothrow && !object) {
            throw new Error(`no instances of class '${className}' in object registry`);
        }

        return object;
    }

    /**
     * Returns an array with all instances of the given class or class name.
     * This is a live array, it should not be kept or modified. If you need
     * a storable/editable array, use [[ObjectRegistry.cloneArray]] instead.
     * @param scope Class or class name of the instances to return.
     */
    getArray<U extends T = T>(scope?: ObjectOrTypeOrName<U>): Readonly<U[]>
    {
        return this._objLists[this.getTypeName(scope)] || _EMPTY_ARRAY;
    }

    /**
     * Returns a cloned array with all instances of the given class or class name.
     * @param scope Class or class name of the instances to return.
     */
    cloneArray<U extends T = T>(scope?: ObjectOrTypeOrName<U>): U[]
    {
        return this.getArray(scope).slice();
    }

    /**
     * Returns an object by its id.
     * @param id An object's id.
     */
    getById(id: string): T | undefined
    {
        return this._objDict[id];
    }

    /**
     * Returns a dictionary with all objects in the registry accessible by their ids.
     * The dictionary only contains objects with an 'id' property.
     */
    getDictionary(): Readonly<Dictionary<T>>
    {
        return this._objDict;
    }

    getByTag(tag: string): Readonly<T[]>
    {
        return this._objTags[tag] || _EMPTY_ARRAY;
    }

    /**
     * Adds a listener for an object add/remove event.
     * @param scope Type, type instance, or type name to subscribe to.
     * @param callback Callback function, invoked when the event is emitted.
     * @param context Optional: this context for the callback invocation.
     */
    on<U extends T>(scope: ObjectOrTypeOrName<U>, callback: (event: IObjectEvent<U>) => void, context?: object)
    {
        super.on(this.getTypeName(scope), callback, context);
    }

    /**
     * Adds a one-time listener for an object add/remove event.
     * @param scope Type, type instance, or type name to subscribe to.
     * @param callback Callback function, invoked when the event is emitted.
     * @param context Optional: this context for the callback invocation.
     */
    once<U extends T>(scope: ObjectOrTypeOrName<U>, callback: (event: IObjectEvent<U>) => void, context?: object)
    {
        super.once(this.getTypeName(scope), callback, context);
    }

    /**
     * Removes a listener for an object add/remove event.
     * @param scope Type, type instance, or type name to subscribe to.
     * @param callback Callback function, invoked when the event is emitted.
     * @param context Optional: this context for the callback invocation.
     */
    off<U extends T>(scope: ObjectOrTypeOrName<U>, callback: (event: IObjectEvent<U>) => void, context?: object)
    {
        super.off(this.getTypeName(scope), callback, context);
    }

    /**
     * Returns the type name for the given instance, type or name.
     * @param scope
     */
    getTypeName(scope?: ObjectOrTypeOrName): string
    {
        return typeof scope === "function" ? (scope as any).typeName : (typeof scope === "object"
            ? (scope.constructor as any).typeName : (scope || this._rootTypeName));
    }
}