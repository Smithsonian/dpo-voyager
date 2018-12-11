/**
 * 3D Foundation Project
 * Copyright 2018 Smithsonian Institution
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import * as THREE from "three";

import types from "@ff/core/ecs/propertyTypes";
import Light from "./Light";

import { ILight as ILightData, TVector3 } from "common/types/presentation";

////////////////////////////////////////////////////////////////////////////////

export default class PointLight extends Light
{
    static readonly type: string = "PointLight";

    ins = this.ins.append({
        color: types.ColorRGB("Color"),
        intensity: types.Number("Intensity", 1),
        distance: types.Number("Distance"),
        decay: types.Number("Decay", 1)
    });

    get light(): THREE.PointLight
    {
        return this.object3D as THREE.PointLight;
    }

    create()
    {
        super.create();

        this.object3D = new THREE.PointLight();
    }

    update()
    {
        const light = this.light;
        const { color, intensity, distance, decay } = this.ins;

        light.color.fromArray(color.value);
        light.intensity = intensity.value;
        light.distance = distance.value;
        light.decay = decay.value;
    }

    fromData(data: ILightData)
    {
        this.ins.setValuesByKey({
            color: data.color !== undefined ? data.color.slice() : [ 1, 1, 1 ],
            intensity: data.intensity !== undefined ? data.intensity : 1,
            distance: data.point.distance || 0,
            decay: data.point.decay !== undefined ? data.point.decay : 1
        });
    }

    toData(): ILightData
    {
        const data: Partial<ILightData> = {};
        const ins = this.ins;

        data.type = "point";
        data.color = ins.color.value.slice() as TVector3;
        data.intensity = ins.intensity.value;
        data.point = {
            distance: ins.distance.value,
            decay: ins.decay.value
        };

        return data as ILightData;
    }
}