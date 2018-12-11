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

import { ILight as ILightData, INode, TVector3 } from "common/types/presentation";

////////////////////////////////////////////////////////////////////////////////

export default class DirectionalLight extends Light
{
    static readonly type: string = "DirectionalLight";

    ins = this.ins.append({
        color: types.ColorRGB("Color"),
        intensity: types.Number("Intensity", 1),
        position: types.Vector3("Position", [ 0, 1, 0 ]),
        target: types.Vector3("Target")
    });

    get light(): THREE.DirectionalLight
    {
        return this.object3D as THREE.DirectionalLight;
    }

    create()
    {
        super.create();

        this.object3D = new THREE.DirectionalLight();
    }

    update()
    {
        const light = this.light;
        const { color, intensity, position, target } = this.ins;

        light.color.fromArray(color.value);
        light.intensity = intensity.value;
        light.position.fromArray(position.value);
        light.target.position.fromArray(target.value);

        light.updateMatrix();
    }

    fromData(data: ILightData)
    {
        this.ins.setValuesByKey({
            color: data.color !== undefined ? data.color.slice() : [ 1, 1, 1 ],
            intensity: data.intensity !== undefined ? data.intensity : 1,
            position: [ 0, 0, 0 ]
        });
    }

    toData(): ILightData
    {
        const data: Partial<ILightData> = {};
        const ins = this.ins;

        data.type = "directional";
        data.color = ins.color.value.slice() as TVector3;
        data.intensity = ins.intensity.value;

        return data as ILightData;
    }
}