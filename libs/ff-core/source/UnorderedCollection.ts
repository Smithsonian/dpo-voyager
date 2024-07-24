/**
 * FF Typescript Foundation Library
 * Copyright 2019 Ralph Wiedemeier, Frame Factory GmbH
 *
 * License: MIT
 */

import { Dictionary, MaybeIdentifiable } from "./types";
import Publisher, { ITypedEvent } from "./Publisher";

////////////////////////////////////////////////////////////////////////////////

/**
 * Fired after the [[UnorderedCollection]] has been updated.
 * @event
 */
export interface ICollectionUpdateEvent<T extends MaybeIdentifiable> extends ITypedEvent<"update">
{
    item: T;
    what: "insert" | "remove" | "update";
}

/**
 * Container storing an unordered collection of items. Items can be retrieved and manipulated by
 * id. Internally, the collection is stored in a key/value dictionary. Items may provide an
 * 'id' property with a unique identifier.
 *
 * Updates to the collection are published via [[ICollectionUpdateEvent]] events.
 */
export default class UnorderedCollection<T extends MaybeIdentifiable> extends Publisher
{
    private _dict: Dictionary<T>;

    /**
     * Returns the number of items in the collection.
     */
    get length() {
        return this.ids.length;
    }

    /**
     * Returns an unordered array with all collection items.
     */
    get items() {
        return this.ids.map(id => this._dict[id]);
    }

    set items(items: T[])
    {
        items.forEach(item => {
            if (item.id) {
                this._dict[item.id] = item;
            }
        });

        this.emit<ICollectionUpdateEvent<T>>({ type: "update", item: null, what: "update" });
    }

    /**
     * Returns an unordered array with the ids of all collection items.
     */
    get ids() {
        return Object.keys(this._dict);
    }

    /**
     * Returns a shallow copy of the internal id/item dictionary.
     */
    get dictionary() {
        return this._dict;
    }

    set dictionary(dict: Dictionary<T>)
    {
        this._dict = dict;
        this.emit<ICollectionUpdateEvent<T>>({ type: "update", item: null, what: "update" });
    }

    constructor(items?: T[])
    {
        super();
        this.addEvent("update");

        this._dict = {};

        items && items.forEach(item => {
            if (item.id) {
                this._dict[item.id] = item;
            }
        });
    }

    insert(item: T, id?: string)
    {
        id = id || item.id;

        if (!id) {
            throw new Error("can't insert, missing id");
        }

        this._dict[id] = item;
        this.emit<ICollectionUpdateEvent<T>>({ type: "update", item, what: "insert" });
    }

    remove(itemOrId: T | string)
    {
        const id = typeof itemOrId === "string" ? itemOrId : itemOrId.id;

        const item = this._dict[id];
        if (item === undefined) {
            return;
        }

        delete this._dict[id];
        this.emit<ICollectionUpdateEvent<T>>({ type: "update", item, what: "remove" });
    }

    get(id: string)
    {
        return this._dict[id];
    }

    getOrCreate(id: string, defaultItem: T)
    {
        let item = this._dict[id];

        if (!item) {
            item = this._dict[id] = defaultItem;
            this.emit<ICollectionUpdateEvent<T>>({ type: "update", item, what: "insert" });
        }

        return item as T;
    }

    /**
     * Replaces the internal id/item dictionary with a shallow copy of the given id/item dictionary.
     * @param dict
     */
    copy(dict: Dictionary<T>)
    {
        this.dictionary = Object.assign({}, dict);
    }

    /**
     * Returns a shallow copy of the internal id/item dictionary.
     */
    clone()
    {
        return Object.assign({}, this._dict);
    }
}