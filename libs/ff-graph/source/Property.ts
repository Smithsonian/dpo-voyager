/**
 * FF Typescript Foundation Library
 * Copyright 2019 Ralph Wiedemeier, Frame Factory GmbH
 *
 * License: MIT
 */

import isSubclass from "@ff/core/isSubclass";
import { Dictionary } from "@ff/core/types";
import Publisher, { ITypedEvent } from "@ff/core/Publisher";

import { ValueType, canConvert } from "./convert";
import PropertyGroup, { ILinkable } from "./PropertyGroup";
import PropertyLink from "./PropertyLink";
import { schemas, types, IPropertySchema, IPropertyTemplate } from "./propertyTypes";

/////////////////////////////////////////////////////////////////////////////////

export { schemas, types, IPropertySchema, IPropertyTemplate };

export type PropertyFromTemplate<T> = T extends IPropertyTemplate<infer U> ? Property<U> : never;
export type PropertiesFromTemplates<T> = { [P in keyof T]: PropertyFromTemplate<T[P]> };

export interface IPropertyChangeEvent extends ITypedEvent<"change">
{
    what: "path" | "options";
    property: Property;
}

export interface IPropertyLinkEvent extends ITypedEvent<"link">
{
    link: PropertyLink;
    add: boolean;
    remove: boolean;
}

export interface IPropertyDisposeEvent extends ITypedEvent<"dispose">
{
    property: Property;
}

/**
 * Linkable property.
 */
export default class Property<T = any> extends Publisher
{
    value: T;
    changed: boolean;

    readonly type: ValueType;
    readonly schema: IPropertySchema<T>;
    readonly custom: boolean;
    readonly elementCount: number;

    readonly inLinks: PropertyLink[];
    readonly outLinks: PropertyLink[];

    private _group: PropertyGroup;
    private _key: string;
    private _path: string;

    /**
     * Creates a new linkable property.
     * @param path Name and group(s) the property is displayed under.
     * @param schema Property schema definition.
     * @param custom Marks the property as user-defined if set to true.
     */
    constructor(path: string, schema: IPropertySchema<T>, custom?: boolean)
    {
        super();
        this.addEvents("value", "link", "change", "dispose");

        if (!schema || schema.preset === undefined) {
            throw new Error("missing schema/preset");
        }

        const preset = schema.preset;
        const isArray = Array.isArray(preset);

        this.type = typeof (isArray ? preset[0] : preset) as ValueType;
        this.schema = schema;
        this.custom = custom || false;
        this.elementCount = isArray ? (preset as any).length : 1;

        this.inLinks = [];
        this.outLinks = [];

        this._group = null;
        this._key = "";
        this._path = path;

        this.value = null;
        this.reset();
        this.changed = !schema.event;
    }

    get group() {
        return this._group;
    }
    get key() {
        return this._key;
    }

    get path() {
        return this._path;
    }
    set path(path: string) {
        this._path = path;
        this.emit<IPropertyChangeEvent>({ type: "change", what: "path", property: this });
    }

    get name() {
        return this._path.split(".").pop();
    }

    // /**
    //  * Adds the property to the given group.
    //  * @param group The property group this property should be added to.
    //  * @param key An optional key under which the property is accessible in the property group.
    //  * @param index An optional index position where the property should be inserted in the group.
    //  */
    // attach(group: PropertyGroup, key?: string, index?: number)
    // {
    //     group._addProperty(this, key, index);
    // }
    //
    // /**
    //  * Removes the property from the group it was previously added to.
    //  * Does nothing if the property is not member of a group.
    //  */
    // detach()
    // {
    //     if (this._group) {
    //         this._group._removeProperty(this);
    //     }
    // }

    /**
     * Removes the property from its group, removes all links.
     * Emits a [[IPropertyDisposeEvent]] event.
     */
    dispose()
    {
        this.unlink();

        if (this._group) {
            this._group.removeProperty(this);
        }

        this.emit<IPropertyDisposeEvent>({ type: "dispose", property: this });
    }

    setValue(value: T, silent?: boolean, noevent?: boolean)
    {
        this.value = value;

        if (!silent) {
            this.changed = true;

            if (this.isInput()) {
                this._group.linkable.changed = true;
            }
        }

        // TODO: Demo hack
        if (!noevent) {
            this.emit("value", value);
        }

        const outLinks = this.outLinks;
        for (let i = 0, n = outLinks.length; i < n; ++i) {
            outLinks[i].push();
        }
    }

    setOption(option: string, silent?: boolean, noevent?: boolean)
    {
        if (!this.schema.options) {
            throw new Error("not an 'option' type");
        }

        const value = this.schema.options.indexOf(option);
        if (value >= 0) {
            this.setValue(value as any, silent, noevent);
        }

    }

    copyValue(value: T, silent?: boolean)
    {
        if (Array.isArray(value)) {
            value = value.slice() as any;
        }

        this.setValue(value, silent);
    }

    set(silent?: boolean)
    {
        if (!silent) {
            this.changed = true;

            if (this.isInput()) {
                this._group.linkable.changed = true;
            }
        }

        this.emit("value", this.value);

        const outLinks = this.outLinks;
        for (let i = 0, n = outLinks.length; i < n; ++i) {
            outLinks[i].push();
        }
    }

    cloneValue(): T
    {
        const value = this.value;
        return Array.isArray(value) ? value.slice() as any : value;
    }

    /**
     * Returns the property value, validated against the property schema.
     * @param result Optional array to write the validated values into.
     */
    getValidatedValue(result?: T)
    {
        const value = this.value as any;

        if (this.isArray()) {
            result = result || [] as any as T;
            for (let i = 0, n = value.length; i < n; ++i) {
                result[i] = this.validateValue(value[i]);
            }
            return result;
        }

        return this.validateValue(value);
    }

    linkTo(destination: Property, sourceIndex?: number, destinationIndex?: number)
    {
        destination.linkFrom(this, sourceIndex, destinationIndex);
    }

    linkFrom(source: Property, sourceIndex?: number, destinationIndex?: number)
    {
        if (!this.canLinkFrom(source, sourceIndex, destinationIndex)) {
            throw new Error(`can't link from '${source.path}' to '${this.path}'`);
        }

        const link = new PropertyLink(source, this, sourceIndex, destinationIndex);
        source.addOutLink(link);
        this.addInLink(link);
    }

    unlinkTo(destination: Property, sourceIndex?: number, destinationIndex?: number)
    {
        destination.unlinkFrom(this, sourceIndex, destinationIndex);
    }

    unlinkFrom(source: Property, sourceIndex?: number, destinationIndex?: number): boolean
    {
        const link = this.inLinks.find(link =>
            link.source === source
            && link.sourceIndex === sourceIndex
            && link.destinationIndex === destinationIndex
        );

        if (!link) {
            return false;
        }

        source.removeOutLink(link);
        this.removeInLink(link);

        return true;
    }

    unlink()
    {
        const inLinks = this.inLinks.slice();
        inLinks.forEach(link => {
            link.source.removeOutLink(link);
            this.removeInLink(link)
        });

        const outLinks = this.outLinks.slice();
        outLinks.forEach(link => {
            this.removeOutLink(link);
            link.destination.removeInLink(link);
        });

        if (this.inLinks.length !== 0 || this.outLinks.length !== 0) {
            throw new Error("fatal: leftover links");
        }
    }

    addInLink(link: PropertyLink)
    {
        if(link.destination !== this) {
            throw new Error("input link's destination must equal this");
        }

        this.inLinks.push(link);
        this.requestSort();

        this.emit<IPropertyLinkEvent>({
            type: "link", add: true, remove: false, link
        });
    }

    addOutLink(link: PropertyLink)
    {
        if(link.source !== this) {
            throw new Error("output link's source must equal this");
        }

        this.outLinks.push(link);
        this.requestSort();

        // push value through added link
        link.push();
    }

    removeInLink(link: PropertyLink)
    {
        const index = this.inLinks.indexOf(link);
        if (index < 0) {
            throw new Error("input link not found");
        }

        this.inLinks.splice(index, 1);
        this.requestSort();

        // if last link is removed and if object, reset to default (usually null) values
        if (this.inLinks.length === 0 && this.type === "object") {
            this.reset();
        }

        this.emit<IPropertyLinkEvent>({
            type: "link", add: false, remove: true, link
        });
    }

    removeOutLink(link: PropertyLink)
    {
        const index = this.outLinks.indexOf(link);
        if (index < 0) {
            throw new Error("output link not found");
        }

        this.outLinks.splice(index, 1);
        this.requestSort();
    }

    canLinkTo(destination: Property, sourceIndex?: number, destinationIndex?: number): boolean
    {
        return destination.canLinkFrom(this, sourceIndex, destinationIndex);
    }

    canLinkFrom(source: Property, sourceIndex?: number, destinationIndex?: number): boolean
    {
        // can't link to an output property
        if (this.isOutput()) {
            return false;
        }

        const hasSrcIndex = sourceIndex >= 0;
        const hasDstIndex = destinationIndex >= 0;

        if (!source.isArray() && hasSrcIndex) {
            throw new Error("non-array source property; can't link to element");
        }
        if (!this.isArray() && hasDstIndex) {
            throw new Error("non-array destination property; can't link to element");
        }

        const srcIsArray = source.isArray() && !hasSrcIndex;
        const dstIsArray = this.isArray() && !hasDstIndex;

        if (srcIsArray !== dstIsArray) {
            return false;
        }
        if (srcIsArray && source.elementCount !== this.elementCount) {
            return false;
        }

        if (source.type === "object" && this.type === "object") {
            if (!isSubclass(source.schema.objectType, this.schema.objectType)) {
                return false;
            }
        }

        return canConvert(source.type, this.type);
    }

    reset()
    {
        let value;

        if (this.isMulti()) {
            let multiArray: T[] = this.value as any;

            if (!multiArray) {
                value = multiArray = [] as any;
            }
            else {
                multiArray.length = 1;
            }

            multiArray[0] = this.clonePreset();
        }
        else {
            value = this.clonePreset();
        }

        // set changed flag and push to output links
        this.setValue(value);
    }

    setMultiChannelCount(count: number)
    {
        if (!this.isMulti()) {
            throw new Error("can't set multi channel count on non-multi property");
        }

        const multiArray: T[] = this.value as any;
        const currentCount = multiArray.length;
        multiArray.length = count;

        for (let i = currentCount; i < count; ++i) {
            multiArray[i] = this.clonePreset();
        }

        this.changed = true;
    }

    requestSort()
    {
        if (this._group && this._group.linkable) {
            this._group.linkable.requestSort();
        }
    }

    setOptions(options: string[])
    {
        if (!this.schema.options) {
            throw new Error(`property type mismatch, can't set options on '${this.path}'`);
        }

        this.schema.options = options.slice();
        this.emit<IPropertyChangeEvent>({ type: "change", what: "options", property: this });
    }

    getOptionText()
    {
        const options = this.schema.options;
        if (this.type === "number" && options) {
            const i = Math.trunc(this.value as any);
            return options[i < 0 ? 0 : (i >= options.length ? 0 : i)] || "";
        }
    }

    isInput(): boolean
    {
        return this._group && this._group === this._group.linkable.ins;
    }

    isOutput(): boolean
    {
        return this._group && this._group === this._group.linkable.outs;
    }

    isArray(): boolean
    {
        return Array.isArray(this.schema.preset);
    }

    isMulti(): boolean
    {
        return !!this.schema.multi;
    }

    isDefault()
    {
        const value = this.schema.multi ? this.value[0] : this.value;
        const preset = this.schema.preset;
        const valueLength = Array.isArray(value) ? value.length : -1;
        const presetLength = Array.isArray(preset) ? preset.length : -1;

        if (valueLength !== presetLength) {
            return false;
        }

        if (valueLength >= 0) {
            for (let i = 0; i < valueLength; ++i) {
                if (value[i] !== preset[i]) {
                    return false;
                }
            }
            return true;
        }

        return value === preset;
    }

    hasLinks()
    {
        return this.inLinks.length > 0 || this.outLinks.length > 0;
    }

    hasInLinks(index?: number)
    {
        const links = this.inLinks;

        if (!(index >= 0)) {
            return links.length > 0;
        }

        for (let i = 0, n = links.length; i < n; ++i) {
            if (links[i].destinationIndex === index) {
                return true;
            }
        }

        return false;
    }

    hasMainInLinks()
    {
        const links = this.inLinks;

        for (let i = 0, n = links.length; i < n; ++i) {
            if (!(links[i].destinationIndex >= 0)) {
                return true;
            }
        }

        return false;
    }

    hasOutLinks(index?: number)
    {
        const links = this.outLinks;

        if (!(index >= 0)) {
            return links.length > 0;
        }

        for (let i = 0, n = links.length; i < n; ++i) {
            if (links[i].sourceIndex === index) {
                return true;
            }
        }

        return false;
    }

    inLinkCount()
    {
        return this.inLinks.length;
    }

    outLinkCount()
    {
        return this.outLinks.length;
    }

    toJSON()
    {
        let json: any = this.custom ? {
            path: this.path,
            schema: Object.assign({}, this.schema)
        } : null;

        if (!this.isOutput() && !this.hasMainInLinks() && !this.isDefault() && this.type !== "object") {
            json = json || {};
            json.value = this.value;
        }

        if (this.outLinks.length > 0) {
            json = json || {};
            json.links = this.outLinks.map(link => {
                const jsonLink: any = {
                    id: link.destination._group.linkable.id,
                    key: link.destination.key
                };
                if (link.sourceIndex >= 0) {
                    jsonLink.srcIndex = link.sourceIndex;
                }
                if (link.destinationIndex >= 0) {
                    jsonLink.dstIndex = link.destinationIndex;
                }
                return jsonLink;
            });
        }

        return json;
    }

    fromJSON(json: any, linkableDict: Dictionary<ILinkable>)
    {
        if (json.value !== undefined) {
            this.value = json.value;
        }

        if (json.links !== undefined) {
            json.links.forEach(link => {
                const target = linkableDict[link.id];
                const property = target.ins[link.key];
                property.linkFrom(this, link.srcIndex, link.dstIndex);
            });
        }
    }

    /**
     * Returns a text representation.
     */
    toString()
    {
        const schema = this.schema;
        const typeName = schema.event ? "event" : (schema.options ? "enum" : this.type);
        return `${this.path} [${typeName}]`
    }

    dump(indent: string = "")
    {
        console.log(indent + `Property '${this.path}', key: ${this.key}, value: ${this.value}`);
    }

    /**
     * Validates the given value against the property schema.
     * @param value
     */
    protected validateValue(value: any)
    {
        const schema = this.schema;

        if (schema.enum) {
            const i = Math.trunc(value);
            return schema.enum[i] ? i : 0;
        }
        if (schema.options) {
            const i = Math.trunc(value);
            return i < 0 ? 0 : (i >= schema.options.length ? 0 : i);
        }
        if (this.type === "number") {
            value = schema.min ? Math.max(schema.min, value) : value;
            value = schema.max ? Math.min(schema.max, value) : value;
            return value;
        }

        return value;
    }

    protected clonePreset(): T
    {
        const preset = this.schema.preset;
        return Array.isArray(preset) ? preset.slice() as any : preset;
    }
}
