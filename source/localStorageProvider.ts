/**
 * FF Typescript Foundation Library
 * Copyright 2021 Ralph Wiedemeier, Frame Factory GmbH
 *
 * License: MIT
 */

import uniqueId from "@ff/core/uniqueId";
import IDataProvider, { IIdentifiable } from "./IDataProvider";

////////////////////////////////////////////////////////////////////////////////

/**
 * @deprecated
 */
export class LocalStorageProvider implements IDataProvider
{
    protected storage: Storage;

    constructor()
    {
        this.storage = window ? window.localStorage : null;
    }

    async get(endpoint: string, id: string): Promise<IIdentifiable>
    {
        return this.throwIfNotAvailable()
            .then(() => {
                const key = this.getKey(endpoint, id);

                const json = this.storage.getItem(key);
                if (!json) {
                    return null;
                }

                return JSON.parse(json);
            });
    }

    async put(endpoint: string, obj: IIdentifiable): Promise<void>
    {
        return this.throwIfNotAvailable()
            .then(() => {
                const key = this.getKey(endpoint, obj.id);
                this.storage.setItem(key, JSON.stringify(obj));
            });
    }

    async update(endpoint: string, obj: IIdentifiable): Promise<boolean>
    {
        return this.throwIfNotAvailable()
            .then(() => {
                const key = this.getKey(endpoint, obj.id);
                const json = this.storage.getItem(key);

                if (json) {
                    // merge partial update with existing object
                    obj = Object.assign(JSON.parse(json), obj);
                    this.storage.setItem(key, JSON.stringify(obj));
                    return true;
                }

                return false;
            });
    }

    async insert(endpoint: string, obj: Partial<IIdentifiable>): Promise<string>
    {
        return this.throwIfNotAvailable()
            .then(() => {
                const id = obj.id || this.createId();
                const key = this.getKey(endpoint, id);

                if (this.storage.getItem(key)) {
                    throw new Error("LocalStorage.insert - item with id exists: " + id);
                }

                this.storage.setItem(key, JSON.stringify(obj));
                return id;
            });
    }

    async remove(endpoint: string, id: string): Promise<boolean>
    {
        return this.throwIfNotAvailable()
            .then(() => {
                const key = this.getKey(endpoint, id);

                if (this.storage.getItem(key)) {
                    this.storage.removeItem(key);
                    return true;
                }

                return false;
            });
    }

    protected async throwIfNotAvailable(): Promise<void>
    {
        return new Promise<void>((resolve, reject) => {
            if (this.storage) {
                resolve();
            }
            else {
                reject();
            }
        });
    }

    protected createId(): string
    {
        return uniqueId();
    }

    protected getKey(endpoint: string, id: string)
    {
        return endpoint + "/" + id;
    }
}

const localStorageProvider = new LocalStorageProvider();
export default localStorageProvider;
