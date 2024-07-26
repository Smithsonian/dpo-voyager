/**
 * FF Typescript Foundation Library
 * Copyright 2021 Ralph Wiedemeier, Frame Factory GmbH
 *
 * License: MIT
 */

import uniqueId from "@ff/core/uniqueId";

////////////////////////////////////////////////////////////////////////////////

export class LocalStorage
{
    readonly store: Storage;

    constructor()
    {
        this.store = window ? window.localStorage : null;
    }

    isReady()
    {
        return !!this.store;
    }

    get(endpoint: string, id: string): any
    {
        const key = this.getKey(endpoint, id);

        const json = this.store.getItem(key);
        if (!json) {
            return null;
        }

        return JSON.parse(json);
    }

    set(endpoint: string, id: string, obj: any): string
    {
        id = id || obj.id || uniqueId();
        const key = this.getKey(endpoint, id);
        this.store.setItem(key, JSON.stringify(obj));
        return id;
    }

    remove(endpoint: string, id: string): boolean
    {
        const key = this.getKey(endpoint, id);

        if (this.store.getItem(key)) {
            this.store.removeItem(key);
            return true;
        }

        return false;
    }

    protected getKey(endpoint: string, id: string)
    {
        return endpoint + "/" + id;
    }
}

const localStorage = new LocalStorage();
export default localStorage;
