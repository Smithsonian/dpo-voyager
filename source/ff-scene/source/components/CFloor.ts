/**
 * FF Typescript Foundation Library
 * Copyright 2019 Ralph Wiedemeier, Frame Factory GmbH
 *
 * License: MIT
 */

import CObject3D, { Node, types } from "./CObject3D";
import Floor from "@ff/three/Floor";

////////////////////////////////////////////////////////////////////////////////

export default class CFloor extends CObject3D
{
    static readonly typeName: string = "CFloor";

    protected static readonly floorIns = {
        position: types.Vector3("Floor.Position", [ 0, -25, 0 ]),
        radius: types.Number("Floor.Radius", 50),
        color: types.ColorRGB("Floor.Color", [ 0.6, 0.75, 0.8 ]),
        opacity: types.Percent("Floor.Opacity", 0.5),
        castShadow: types.Boolean("Shadow.Cast"),
        receiveShadow: types.Boolean("Shadow.Receive"),
    };

    ins = this.addInputs<CObject3D, typeof CFloor["floorIns"]>(CFloor.floorIns);

    constructor(node: Node, id: string)
    {
        super(node, id);
        this.object3D = new Floor();
    }

    protected get floor() {
        return this.object3D as Floor;
    }

    update(context)
    {
        super.update(context);

        const ins = this.ins;
        const floor = this.floor;

        if (ins.position.changed || ins.radius.changed) {
            floor.position.fromArray(ins.position.value);
            floor.scale.setScalar(ins.radius.value);
            floor.updateMatrix();
        }
        if (ins.color.changed) {
            floor.material.color.fromArray(ins.color.value);
        }
        if (ins.opacity.changed) {
            floor.material.opacity = ins.opacity.value;
        }

        return true;
    }

    dispose()
    {
        this.floor.dispose();
        super.dispose();
    }
}