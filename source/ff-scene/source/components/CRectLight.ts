
import { Object3D, RectAreaLight, Vector3 } from "three";

import { Node, types } from "@ff/graph/Component";

import CLight from "./CLight";

////////////////////////////////////////////////////////////////////////////////

export default class CRectLight extends CLight
{
    static readonly typeName: string = "CRectLight";

    protected static readonly rectLightIns = {
        position: types.Vector3("Light.Position", [ 0, 1, 0 ]),
        target: types.Vector3("Light.Target", [ 0, 0, 0 ]),
        size: types.Vector2("Light.Size", [10, 10]),
    };

    ins = this.addInputs<CLight, typeof CRectLight["rectLightIns"]>(CRectLight.rectLightIns);

    constructor(node: Node, id: string)
    {
        super(node, id);

        this.object3D = new RectAreaLight();
        
    }

    get light(): RectAreaLight {
        return this.object3D as RectAreaLight;
    }

    update(context)
    {
        super.update(context);

        const light = this.light;
        const ins = this.ins;

        if (ins.position.changed || ins.target.changed) {
            light.position.fromArray(ins.position.value);
            light.updateMatrix();
        }


        return true;
    }
}