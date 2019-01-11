/**
 * 3D Foundation Project
 * Copyright 2018 Smithsonian Institution
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import { Dictionary } from "@ff/core/types";
import uniqueId from "@ff/core/uniqueId";

import Component from "@ff/graph/Component";

////////////////////////////////////////////////////////////////////////////////

/**
 * Component managing a collection of items. Offers helper methods to keep
 * a master collection at root level in sync with this.
 */
export default class Collection<T extends { id?: string }> extends Component
{
    static readonly type: string = "Collection";

    protected items: Dictionary<T> = {};

    /**
     * Returns true if the collection contains an item with the given id.
     * @param {string} id
     * @returns {boolean}
     */
    has(id: string): boolean
    {
        return !!this.items[id];
    }

    /**
     * Returns from the collection the item with the given id.
     * @param {string} id
     * @returns {T | undefined} The item found or undefined if there is no item with the given id.
     */
    get(id: string): T | undefined
    {
        return this.items[id];
    }

    /**
     * Inserts an item into the collection. The item must provide an .id property with a unique identifier.
     * @param {T} item
     * @returns {string} The id of the inserted item.
     */
    insert(item: T): string
    {
        if (!item.id) {
            item.id = uniqueId(8);
        }

        this.items[item.id] = item;
        return item.id;
    }

    /**
     * Removes the item with the given id from the collection.
     * @param {string} id
     * @returns {T} The item removed.
     */
    remove(id: string): T
    {
        const item = this.items[id];
        this.items[id] = undefined;
        return item;
    }

    /**
     * Returns the number of items in the collection.
     * @returns {number} The number of items.
     */
    count()
    {
        return this.getArray().length;
    }

    /**
     * Looks for a hierarchy component, traverses to the root and returns
     * the collection component of the same type from the root entity.
     * @returns {this} Root collection of the same type or null if not found.
     */
    findRootCollection(): this | null
    {
        const hierarchy = this.hierarchy;
        if (hierarchy) {
            return hierarchy.getRoot(this);
        }

        return null;
    }

    /**
     * Returns a dictionary with all collection items, with their id as key.
     * @returns {Dictionary<T extends {id?: string}>}
     */
    getDictionary(): Dictionary<T>
    {
        if (!this.items) {
            return {};
        }

        const keys = Object.keys(this.items);
        const dict = {};

        keys.forEach(key => {
            const item = this.items[key];
            if (item !== undefined) {
                dict[item.id] = item;
            }
        });

        return dict;
    }

    /**
     * Returns an array with all collection items.
     * @returns {T[]}
     */
    getArray(): T[]
    {
        if (!this.items) {
            return [];
        }

        return Object.keys(this.items)
        .map(key => this.items[key])
        .filter(item => item !== undefined);
    }

    /**
     * Returns a text representation of this object.
     * @returns {string}
     */
    toString()
    {
        return super.toString() + ` - items: ${this.count()}`;
    }
}