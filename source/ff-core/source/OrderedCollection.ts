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
 * Fired after the [[OrderedCollection]] has been updated.
 * @event
 */
export interface ICollectionUpdateEvent<T extends MaybeIdentifiable> extends ITypedEvent<"update">
{
    item: T;
    what: "add" | "remove" | "replace" | "move" | "update";
}

/**
 * Container storing an ordered list of items. Items can be retrieved and manipulated by
 * id or by positional index. Internally, the collection is stored in both an array and
 * a dictionary.
 *
 * To make use of the dictionary functionality, items must provide an 'id' property with
 * a unique identifier.
 *
 * Updates to the collection are published via [[ICollectionUpdateEvent]] events.
 */
export default class OrderedCollection<T extends MaybeIdentifiable> extends Publisher
{
    private _list: T[];
    private _dict: Dictionary<T>;


    constructor(items?: T[])
    {
        super();
        this.addEvent("update");

        this._list = items || [];
        this._dict = {};

        items && items.forEach(item => {
            if (item.id) {
                this._dict[item.id] = item;
            }
        });
    }

    /**
     * Returns the number of items in the collection.
     */
    get length() {
        return this._list.length;
    }

    /**
     * Returns an unordered array with the ids of all collection items.
     */
    get ids() {
        return Object.keys(this._dict);
    }

    /**
     * Returns an ordered array with all collection items.
     */
    get items() {
        return this._list;
    }

    /**
     * Replaces the collection items with the given list.
     * @param items
     */
    set items(items: T[])
    {
        this._list = items;
        this._dict = {};

        items.forEach(item => {
            if (item.id) {
                this._dict[item.id] = item;
            }
        });

        this.emit<ICollectionUpdateEvent<T>>({ type: "update", item: null, what: "update" });
    }

    /**
     * Adds an item at the end of the collection.
     * @param item
     */
    append(item: T)
    {
        this._list.push(item);

        if (item.id) {
            this._dict[item.id] = item;
        }

        this.emit<ICollectionUpdateEvent<T>>({ type: "update", item, what: "add" });
    }

    /**
     * Inserts an item in front of another one.
     * @param item
     * @param beforeItem
     */
    insertBefore(item: T, beforeItem: T)
    {
        const index = this._list.indexOf(beforeItem);
        if (index >= 0) {
            this.insertAt(item, index);
        }
    }

    /**
     * Inserts an item at a given position index.
     * @param item
     * @param index
     */
    insertAt(item: T, index: number)
    {
        this._list.splice(index, 0, item);

        if (item.id) {
            this._dict[item.id] = item;
        }

        this.emit<ICollectionUpdateEvent<T>>({ type: "update", item, what: "add" });
    }

    /**
     * Replaces an item with another one.
     * @param item The new item.
     * @param replaceItem The item to be replaced.
     */
    replaceItem(item: T, replaceItem: T)
    {
        const index = this._list.indexOf(replaceItem);
        if (index >= 0) {
            this.replaceAt(item, index);
        }
    }

    /**
     * Replaces the item at the given index position with another one.
     * @param item
     * @param index
     */
    replaceAt(item: T, index: number)
    {
        const existing = this._list[index];
        if (existing.id) {
            delete this._dict[existing.id];
        }

        this._list[index] = item;

        if (item.id) {
            this._dict[item.id] = item;
        }

        this.emit<ICollectionUpdateEvent<T>>({ type: "update", item, what: "replace" });
    }

    /**
     * Moves the item relative to its current position.
     * @param item The item to move.
     * @param relativeIndex The number of positions to move, positive = move towards end, negative = move towards start.
     */
    moveItem(item: T, relativeIndex: number)
    {
        const index = this._list.indexOf(item);
        this.moveAt(index, relativeIndex);
    }

    /**
     * Moves the item at the given index position relative to its current position.
     * @param index The index of the item to move.
     * @param relativeIndex The number of positions to move, positive = move towards end, negative = move towards start.
     */
    moveAt(index: number, relativeIndex: number)
    {
        const items = this._list;

        if (index + relativeIndex < 0 || index + relativeIndex >= items.length) {
            return;
        }

        const item = items[index];

        if (relativeIndex > 0) {
            for (let i = 0; i < relativeIndex; ++i) {
                items[index + i] = items[index + i + 1];
            }
            items[index + relativeIndex] = item;
        }
        else if (relativeIndex < 0) {
            for (let i = 0; i > relativeIndex; --i) {
                items[index + i] = items[index + i - 1];
            }
            items[index + relativeIndex] = item;
        }
        else {
            return;
        }

        this.emit<ICollectionUpdateEvent<T>>({ type: "update", item, what: "move" });
    }

    /**
     * Removes an item by its id.
     * @param id
     * @returns the removed item.
     */
    removeById(id: string): T
    {
        const item = this._dict[id];
        if (item) {
            this.removeItem(item);
        }
        return item;
    }

    /**
     * Removes the given item from the collection.
     * @param item
     * @returns the position index of the removed item.
     */
    removeItem(item: T): number
    {
        const index = this._list.indexOf(item);
        this.removeAt(index);
        return index;
    }

    /**
     * Removes the item at the given index position from the collection.
     * @param index
     * @returns the removed item.
     */
    removeAt(index: number): T
    {
        const items = this._list;

        if (index < 0 || index >= items.length) {
            return;
        }

        const item = items[index];
        items.splice(index, 1);

        if (item.id) {
            delete this._dict[item.id];
        }

        this.emit<ICollectionUpdateEvent<T>>({ type: "update", item, what: "remove" });
        return item;
    }

    /**
     * Returns the item at the given index position.
     * @param index
     */
    getAt(index: number)
    {
        return this._list[index];
    }

    /**
     * Return an item by its id.
     * @param id
     */
    getById(id: string)
    {
        return this._dict[id];
    }

    /**
     * Returns the index position of the given item.
     * @param item
     */
    getIndexOf(item: T)
    {
        return this._list.indexOf(item);
    }

    /**
     * Replaces the collection items with a shallow copy of the given list.
     * @param list
     */
    copy(list: T[])
    {
        this.items = list.slice();
    }

    /**
     * Returns a shallow copy of the internal item list.
     */
    clone()
    {
        return this._list.slice();
    }
}

OrderedCollection.prototype[Symbol.iterator] = function() {
    return {
        index: 0,
        list: this._list,

        next: function() {
            if (this.index < this.list.length) {
                return { value: this.list[this.index++], done: false }
            }
            else {
                return { done: true };
            }
        }
    }
};