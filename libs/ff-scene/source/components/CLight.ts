/**
 * FF Typescript Foundation Library
 * Copyright 2019 Ralph Wiedemeier, Frame Factory GmbH
 *
 * License: MIT
 */

import { Light } from "three";

import { Node, types } from "@ff/graph/Component";
import CObject3D from "./CObject3D";

////////////////////////////////////////////////////////////////////////////////

export enum EShadowMapResolution { Low, Medium, High }

const _mapResolution = {
    [EShadowMapResolution.Low]: 512,
    [EShadowMapResolution.Medium]: 1024,
    [EShadowMapResolution.High]: 2048,
};

export default class CLight extends CObject3D
{
    static readonly typeName: string = "CLight";

    protected static readonly lightIns = {
        color: types.ColorRGB("Light.Color"),
        intensity: types.Number("Light.Intensity", 1),
        shadowEnabled: types.Boolean("Shadow.Enabled"),
        shadowResolution: types.Enum("Shadow.Resolution", EShadowMapResolution, EShadowMapResolution.Medium),
        shadowBlur: types.Number("Shadow.Blur", 1),
    };

    ins = this.addInputs<CObject3D, typeof CLight["lightIns"]>(CLight.lightIns);

    get light(): Light
    {
        return this.object3D as Light;
    }

    update(context)
    {
        super.update(context);

        const light = this.light;
        const ins = this.ins;

        if (ins.color.changed || ins.intensity.changed) {
            light.color.fromArray(ins.color.value);
            light.intensity = ins.intensity.value;
        }

        //some lights, like ambient and hemisphere light don't have shadows
        if("shadow" in light){
            if (ins.shadowEnabled.changed) {
                light.castShadow = ins.shadowEnabled.value;
            }

            if(ins.shadowBlur.changed){
                light.shadow.radius = ins.shadowBlur.value;
            }
                
            if (ins.shadowResolution.changed) {
                const mapResolution = _mapResolution[ins.shadowResolution.getValidatedValue()];
                light.shadow.mapSize.set(mapResolution, mapResolution);
                light.shadow.map = null; // TODO: check for resource leak
            }
        }

        return true;
    }
}