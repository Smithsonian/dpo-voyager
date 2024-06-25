/**
 * Flow - Typescript/React Foundation Library
 * Copyright 2021 Ralph Wiedemeier, Frame Factory GmbH
 *
 * License: MIT
 */

export interface IIdentifiable
{
    id: string;
}

export default interface IDataProvider
{
    /** Retrieve the object with the given id. Returns object or null if not found. */
    get: (endpoint: string, id: string) => Promise<IIdentifiable>;
    /** Create or replace the entire object. */
    put: (endpoint: string, obj: IIdentifiable) => Promise<void>;

    /** Update the object, partial data allowed. Returns true if object found and updated. */
    update: (endpoint: string, obj: IIdentifiable) => Promise<boolean>;
    /** Insert a new object and return its id. */
    insert: (endpoint: string, obj: Partial<IIdentifiable>) => Promise<string>;

    /** Delete the object with the given id. Returns true if object found and deleted. */
    remove: (endpoint: string, id: string) => Promise<boolean>;
}