
import { HemisphereLight } from "three";

import { Node, types } from "@ff/graph/Component";

import CLight from "./CLight";

////////////////////////////////////////////////////////////////////////////////


export default class CHemisphereLight extends CLight
{
    static readonly typeName: string = "CHemisphereLight";

    protected static readonly hemiLightIns = {
        ground: types.ColorRGB("Light.Ground", [ 0.31, 0.31, 0.125]),
    };

    ins = this.addInputs<CLight, typeof CHemisphereLight["hemiLightIns"]>(CHemisphereLight.hemiLightIns);

    constructor(node: Node, id: string)
    {
        super(node, id);
        this.object3D = new HemisphereLight();
    }

    get light(): HemisphereLight {
        return this.object3D as HemisphereLight;
    }
    update(context)
    {
        super.update(context);

        const light = this.light;
        const ins = this.ins;

        if (ins.ground.changed || ins.intensity.changed) {
            light.groundColor.fromArray(ins.ground.value);
            light.intensity = ins.intensity.value;
        }
        return true;
    }

}