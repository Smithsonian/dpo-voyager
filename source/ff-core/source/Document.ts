/**
 * FF Typescript Foundation Library
 * Copyright 2019 Ralph Wiedemeier, Frame Factory GmbH
 *
 * License: MIT
 */

import Publisher, { ITypedEvent } from "./Publisher";
import uniqueId from "./uniqueId";

////////////////////////////////////////////////////////////////////////////////

export interface IDocumentUpdateEvent<T extends Document = Document> extends ITypedEvent<"update">
{
    document: T;
}

export interface IDocumentDisposeEvent<T extends Document = Document> extends ITypedEvent<"dispose">
{
    document: T;
}

export default class Document<T extends any = any, U = T> extends Publisher
{
    static generateId()
    {
        return uniqueId();
    }

    private _data: T;

    constructor(json?: U)
    {
        super();
        this.addEvents("update", "dispose");

        if (json) {
            this.fromJSON(json);
        }
        else {
            this._data = this.init();
        }
    }

    get id() {
        return this._data["id"];
    }

    get data() {
        return this._data;
    }

    set<K extends keyof T>(key: K, value: T[K])
    {
        this._data[key] = value;
        this.update();
    }

    get<K extends keyof T>(key: K): T[K] {
        return this._data[key];
    }

    update()
    {
        this.emit<IDocumentUpdateEvent>({ type: "update", document: this });
    }

    dispose()
    {
        this.emit<IDocumentDisposeEvent>({ type: "dispose", document: this });
        this._data = null;
    }

    fromJSON(json: U): this
    {
        this._data = {} as T;
        this.inflate(json, this._data);
        this.update();

        return this;
    }

    toJSON(json?: U): U
    {
        json = json || {} as U;
        this.deflate(this._data, json);
        return json;
    }

    protected init(): T
    {
        return {} as T;
    }

    protected inflate(json: U, data: T)
    {
        Object.assign(data, json);
    }

    protected deflate(data: T, json: U)
    {
        json = json || {} as U;
        Object.assign(json, this._data);
    }
}