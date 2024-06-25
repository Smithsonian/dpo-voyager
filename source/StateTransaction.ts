/**
 * FF Typescript Foundation Library
 * Copyright 2019 Ralph Wiedemeier, Frame Factory GmbH
 *
 * License: MIT
 */

export type StatePath = string | (string | number)[];

export default class StateTransaction<T = any>
{
    protected current: T;
    protected next: T;
    protected copied: {};

    constructor(state: T)
    {
        if (typeof state !== "object") {
            throw new Error("state should be of type object");
        }

        this.current = state;
        this.next = Object.assign({}, state);
        this.copied = {};
    }

    commit(): T
    {
        this.current = null;
        return this.next;
    }

    set<T>(value: T, path: StatePath)
    {
        this.modify(path, (current, next, prop) => {
            next[prop] = value;
        });
    }

    delete(path: StatePath)
    {
        this.modify(path, (current, next, prop) => {
            delete next[prop];
        })
    }

    insert(value: any, index: number, path: StatePath)
    {
        this.modify(path, (current, next, prop) => {
            const arr = current[prop];
            if (!Array.isArray(arr)) {
                throw new Error(`expected array at '${path}' but found '${typeof arr}'`);
            }

            next[prop] = arr.slice(0, index - 1).concat([ value ], arr.slice(index));
        });
    }

    remove(index: number, path: StatePath)
    {
        this.modify(path, (current, next, prop) => {
            const arr = current[prop];
            if (!Array.isArray(arr)) {
                throw new Error(`expected array at '${path}' but found '${typeof arr}'`);
            }

            next[prop] = arr.slice().splice(index, 1);
        });
    }

    modify(path: StatePath, modifier: (current: any, next: any, prop: string | number) => void)
    {
        //console.log("current", this.current);
        //console.log("next", this.next);
        //console.log("path", path);

        if (this.current === undefined) {
            throw new Error("transaction closed, no further modifications allowed");
        }

        const props = Array.isArray(path) ? path : path.split(".");
        const valueProp = props.pop();

        let currentCursor = this.current;
        let nextCursor = this.next;
        let copiedCursor = this.copied;

        for(let prop of props) {
            if (copiedCursor[prop] === undefined) {

                let current = currentCursor[prop];

                if (typeof current === "object") {
                    nextCursor[prop] = Array.isArray(current) ? current.slice() : Object.assign({}, current);
                }
                else {
                    throw new Error(`expected object at '${prop}' in '${path}' but found '${typeof current}'`);
                }

                copiedCursor[prop] = {};
            }

            currentCursor = currentCursor[prop];
            nextCursor = nextCursor[prop];
            copiedCursor = copiedCursor[prop]
        }

        modifier(currentCursor, nextCursor, valueProp);

        //console.log("copied", this.copied);
        //console.log("current", this.current);
        //console.log("next", this.next);
    }
}