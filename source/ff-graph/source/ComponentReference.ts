/**
 * FF Typescript Foundation Library
 * Copyright 2019 Ralph Wiedemeier, Frame Factory GmbH
 *
 * License: MIT
 */

import Component, { ComponentOrType } from "./Component";
import System from "./System";

////////////////////////////////////////////////////////////////////////////////

/**
 * Maintains a weak reference to a component.
 * The reference is set to null after the linked component is removed.
 */
export default class ComponentReference<T extends Component = Component>
{
    private _id: string;
    private readonly _typeName: string;
    private readonly _system: System;

    constructor(system: System, scope?: ComponentOrType<T>) {
        this._typeName = scope ? Component.getTypeName(scope) : null;
        this._id = scope instanceof Component ? scope.id : undefined;
        this._system = system;
    }

    get component(): T | null {
        return this._id ? this._system.components.getById(this._id) as T || null : null;
    }
    set component(component: T) {
        if (component && this._typeName && !(component instanceof this._system.registry.getType(this._typeName))) {
            throw new Error(`can't assign component of class '${(component as Component).constructor.name || "unknown"}' to link of class '${this._typeName}'`);
        }
        this._id = component ? component.id : undefined;
    }
}