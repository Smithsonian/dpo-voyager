/**
 * FF Typescript Foundation Library
 * Copyright 2019 Ralph Wiedemeier, Frame Factory GmbH
 *
 * License: MIT
 */

import { ReturnType } from "@ff/core/types";
import Commander from "@ff/core/Commander";

import Component, { types } from "../Component";

////////////////////////////////////////////////////////////////////////////////

export { Commander, types  };
export type Actions<T extends CController<any>> = ReturnType<T["createActions"]>;

export default class CController<T extends CController<any>> extends Component
{
    static readonly typeName: string = "CController";
    static readonly isSystemSingleton: boolean = true;

    readonly actions: Actions<CController<T>>;

    createActions(commander: Commander)
    {
        return {};
    }
}