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

import { ILight as ILightData, Vector3 } from "common/types/presentation";

////////////////////////////////////////////////////////////////////////////////

export default class PointLight extends Light
{
    static readonly type: string = "PointLight";

    ins = this.makeProps({
        col: types.ColorRGB("Color"),
        int: types.Number("Intensity", 1),
        dst: types.Number("Distance"),
        dcy: types.Number("Decay", 1)
    });

    get light(): THREE.PointLight
    {
        return this.object3D as THREE.PointLight;
    }

    create(context)
    {
        super.create(context);

        this.object3D = new THREE.PointLight();
    }

    update()
    {
        const light = this.light;
        const { col, int, dst, dcy } = this.ins;

        light.color.fromArray(col.value);
        light.intensity = int.value;
        light.distance = dst.value;
        light.decay = dcy.value;
    }

    fromData(data: ILightData)
    {
        this.ins.setValues({
            col: data.color !== undefined ? data.color.slice() : [ 1, 1, 1 ],
            int: data.intensity !== undefined ? data.intensity : 1,
            dst: data.point.distance || 0,
            dcy: data.point.decay !== undefined ? data.point.decay : 1
        });
    }

    toData(): ILightData
    {
        const data: Partial<ILightData> = {};
        const ins = this.ins;

        data.type = "point";
        data.color = ins.col.value.slice() as Vector3;
        data.intensity = ins.int.value;
        data.point = {
            distance: ins.dst.value,
            decay: ins.dcy.value
        };

        return data as ILightData;
    }
}