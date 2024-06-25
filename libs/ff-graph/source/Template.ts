/**
 * FF Typescript Foundation Library
 * Copyright 2019 Ralph Wiedemeier, Frame Factory GmbH
 *
 * License: MIT
 */

import { types } from "./propertyTypes";
import Component from "./Component";

////////////////////////////////////////////////////////////////////////////////

export class Base extends Component
{
    static readonly type: string = "Base";

    ins = this.ins.append({
        position: types.Vector3("Position")
    });
}

export default class Derived extends Base
{
    static readonly type: string = "Derived";

    ins = this.ins.append({
        rotation: types.Vector3("Rotation")
    });

    outs = this.outs.append({
        matrix: types.Matrix4("Matrix")
    });

    create()
    {
        super.create();
    }

    update(): boolean
    {
        const { position, rotation } = this.ins;

        if (position.changed) {
            // ...
        }

        if (rotation.changed) {
            // ...
        }

        return true;
    }

    tick(): boolean
    {
        return false;
    }

    tock(): boolean
    {
        return false;
    }

    dispose()
    {
        super.dispose();
    }
}