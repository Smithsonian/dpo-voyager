/**
 * FF Typescript Foundation Library
 * Copyright 2019 Ralph Wiedemeier, Frame Factory GmbH
 *
 * License: MIT
 */

import { Dictionary } from "@ff/core/types";
import Publisher, { ITypedEvent } from "@ff/core/Publisher";

import Property, { IPropertySchema, PropertiesFromTemplates } from "./Property";
import uniqueId from "@ff/core/uniqueId";

////////////////////////////////////////////////////////////////////////////////

/**
 * To make use of linkable properties and property sets, classes must implement this interface.
 */
export interface ILinkable
{
    /** A unique identifier for this instance. */
    id: string;
    /** Will be set to true if an input property changes. */
    changed: boolean;

    /** Set of input properties. */
    readonly ins: PropertyGroup;
    /** Set of output properties. */
    readonly outs: PropertyGroup;

    /** Called after property links have been added or removed. */
    requestSort: () => void;
}

/**
 * Emitted by [[Properties]] after changes in the properties configuration.
 * @event
 */
export interface IPropertyGroupPropertyEvent extends ITypedEvent<"property">
{
    add: boolean;
    remove: boolean;
    property: Property;
}

/**
 * A set of properties. Properties can be linked, such that one property updates another.
 * After adding properties to the set, they are available on the set using their key.
 * To make use of linkable properties, classes must implement the [[ILinkable]] interface.
 *
 * ### Events
 * - *"change"* - emits [[IPropertiesChangeEvent]] after properties have been added, removed, or renamed.
 */
export default class PropertyGroup extends Publisher
{
    linkable: ILinkable;
    properties: Property[];

    constructor(linkable: ILinkable)
    {
        super();
        this.addEvent("property");

        this.linkable = linkable;
        this.properties = [];
    }

    get customProperties() {
        return this.properties.filter(property => property.custom);
    }

    dispose()
    {
        this.unlinkAllProperties();
    }

    isInputGroup()
    {
        return this === this.linkable.ins;
    }

    isOutputGroup()
    {
        return this === this.linkable.outs;
    }

    /**
     * Appends properties to the set.
     * @param templates plain object with property templates.
     * @param index Optional index at which to insert the properties.
     */
    createProperties<U>(templates: U, index?: number): this & PropertiesFromTemplates<U>
    {
        Object.keys(templates).forEach((key, i) => {
            const ii = index === undefined ? undefined : index + i;
            const template = templates[key];
            this.createProperty(template.path, template.schema, key, ii);
        });

        return this as this & PropertiesFromTemplates<U>;
    }

    createProperty(path: string, schema: IPropertySchema, key: string, index?: number)
    {
        const property = new Property(path, schema);
        this.addProperty(property, key, index);
        return property;
    }

    createCustomProperty(path: string, schema: IPropertySchema, index?: number)
    {
        const property = new Property(path, schema, /* custom */ true);
        this.addCustomProperty(property, index);
        return property;
    }

    addCustomProperty(property: Property, index?: number)
    {
        const key = uniqueId(5);
        this.addProperty(property, key, index);
    }

    addProperty(property: Property, key: string, index?: number)
    {
        if (property.group) {
            throw new Error("can't add, property already part of a group");
        }

        if (this[key]) {
            throw new Error(`key '${key}' already exists in group`);
        }

        (property as any)._group = this;
        (property as any)._key = key;

        if (index === undefined) {
            this.properties.push(property);
        }
        else {
            this.properties.splice(index, 0, property);
        }

        this[key] = property;

        this.emit<IPropertyGroupPropertyEvent>({
            type: "property", add: true, remove: false, property
        });
    }

    /**
     * Removes the given property from the set.
     * @param {Property} property The property to be removed.
     */
    removeProperty(property: Property)
    {
        if (property.group !== this) {
            throw new Error("can't remove, property not in this group");
        }
        if (property.hasLinks()) {
            throw new Error("can't remove, property has links");
        }

        if (this[property.key] !== property) {
            throw new Error(`property key '${property.key}' not found in group`);
        }

        this.properties.slice(this.properties.indexOf(property), 1);

        delete this[property.key];

        (property as any)._group = null;
        (property as any)._key = "";

        this.emit<IPropertyGroupPropertyEvent>({
            type: "property", add: false, remove: true, property
        });
    }

    /**
     * Returns a property by key.
     * @param {string} key The key of the property to be returned.
     * @returns {Property}
     */
    getProperty(key: string)
    {
        const property = this[key];
        if (!property) {
            throw new Error(`no property found with key '${key}'`);
        }

        return property;
    }

    getKeys(includeObjects: boolean = false)
    {
        const keys: string[] = [];
        this.properties.forEach(property => {
            if (includeObjects || property.type !== "object") {
                keys.push(property.key)
            }
        });
        return keys;
    }

    getValues(includeObjects: boolean = false)
    {
        const values: any[] = [];
        this.properties.map(property => {
            if (includeObjects || property.type !== "object") {
                values.push(property.value)
            }
        });
        return values;
    }

    cloneValues(includeObjects: boolean = false)
    {
        const values: any[] = [];
        this.properties.map(property => {
            if (includeObjects || property.type !== "object") {
                values.push(property.cloneValue())
            }
        });
        return values;
    }

    setValues(values: Dictionary<any>)
    {
        Object.keys(values).forEach(
            key => this.getProperty(key).value = values[key]
        );
    }

    /**
     * Sets the values of multiple properties. Properties are identified by key.
     * @param values Dictionary of property key/value pairs.
     */
    copyValues(values: Dictionary<any>)
    {
        Object.keys(values).forEach(
            key => this.getProperty(key).copyValue(values[key])
        );
    }

    unlinkAllProperties()
    {
        this.properties.forEach(property => property.unlink());
    }

    toJSON()
    {
        let json: any = null;

        this.properties.forEach(property => {
            const jsonProp = property.toJSON();
            if (jsonProp) {
                json = json || {};
                json[property.key] = jsonProp;
            }
        });

        return json;
    }

    fromJSON(json: any)
    {
        Object.keys(json).forEach(key => {
            const jsonProp = json[key];
            if (jsonProp.schema) {
                const property = new Property(jsonProp.path, jsonProp.schema, /* custom */ true);
                this.addProperty(property, key);
            }
        });
    }

    linksFromJSON(json: any, linkableDict: Dictionary<ILinkable>)
    {
        Object.keys(json).forEach(key => {
            this[key].fromJSON(json[key], linkableDict);
        });
    }
}
