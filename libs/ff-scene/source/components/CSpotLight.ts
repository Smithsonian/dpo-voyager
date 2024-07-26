/**
 * FF Typescript Foundation Library
 * Copyright 2019 Ralph Wiedemeier, Frame Factory GmbH
 *
 * License: MIT
 */

import { SpotLight, Object3D, MathUtils } from "three";

import { Node, types } from "@ff/graph/Component";

import CLight from "./CLight";

////////////////////////////////////////////////////////////////////////////////

export default class CSpotLight extends CLight
{
    static readonly typeName: string = "CSpotLight";

    protected static readonly spotLightIns = {
        position: types.Vector3("Light.Position"),
        target: types.Vector3("Light.Target", [ 0, -1, 0 ]),
        distance: types.Number("Light.Distance"),
        decay: types.Number("Light.Decay", 1),
        angle: types.Number("Light.Angle", 45),
        penumbra: types.Percent("Light.Penumbra", 0.5),
    };

    ins = this.addInputs<CLight, typeof CSpotLight["spotLightIns"]>(CSpotLight.spotLightIns);

    constructor(node: Node, id: string)
    {
        super(node, id);

        this.object3D = new SpotLight();
        this.light.target.matrixAutoUpdate = false;
    }

    get light(): SpotLight {
        return this.object3D as SpotLight;
    }

    update(context)
    {
        super.update(context);

        const light = this.light;
        const ins = this.ins;

        if (ins.position.changed || ins.target.changed) {
            light.position.fromArray(ins.position.value);
            light.target.position.fromArray(ins.target.value);
            light.updateMatrix();
            light.target.updateMatrix();
        }

         if (ins.distance.changed || ins.decay.changed || ins.angle.changed || ins.penumbra.changed) {
            light.distance = ins.distance.value;
            light.decay = ins.decay.value;
            light.angle = ins.angle.value * MathUtils.DEG2RAD;
            light.penumbra = ins.penumbra.value;

            //SpotLightShadow doesn't handle camera.near for us, but will set camera.far and update the projection matrix
            light.shadow.camera.near = light.distance? light.distance/800 : 0.5;
        }

        return true;
    }

    protected onAddToParent(parent: Object3D)
    {
        super.onAddToParent(parent);
        parent.add(this.light.target);
    }

    protected onRemoveFromParent(parent: Object3D)
    {
        super.onRemoveFromParent(parent);
        parent.remove(this.light.target);
    }
}