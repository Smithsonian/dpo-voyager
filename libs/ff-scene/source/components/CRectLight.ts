
import { Object3D, RectAreaLight, Vector3 } from "three";

import { Node, types } from "@ff/graph/Component";

import CLight from "./CLight";

////////////////////////////////////////////////////////////////////////////////

export default class CRectLight extends CLight
{
    static readonly typeName: string = "CRectLight";

    protected static readonly rectLightIns = {
        position: types.Vector3("Light.Position", [ 0, 0, 0 ]),
        target: types.Vector3("Light.Target", [ 0, -1, 0 ]),
        size: types.Vector2("Light.Size", [10, 10]),
    };

    ins = this.addInputs<CLight, typeof CRectLight["rectLightIns"]>(CRectLight.rectLightIns);

    constructor(node: Node, id: string)
    {
        super(node, id);

        this.object3D = new RectAreaLight();
        this.light.width = 1;
        this.light.height = 1;
        this.object3D.matrixAutoUpdate = false;
        this.transform.ins.scale.addEventListener("value",this.update, this);
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
            light.lookAt(new Vector3().fromArray(ins.target.value));
            light.updateMatrix();
        }
        //RectAreaLight's size ignores scaling
        this.light.width = this.transform.ins.scale.value[0]*10;
        this.light.height = this.transform.ins.scale.value[2]*10;

        return true;
    }

    dispose(){
        super.dispose();
        this.transform.ins.scale.removeEventListener("value",this.update);
    }
}