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

export default class SpotLight extends Light
{
    static readonly type: string = "SpotLight";

    ins = this.makeProps({
        col: types.ColorRGB("Color"),
        int: types.Number("Intensity", 1),
        dst: types.Number("Distance"),
        dcy: types.Number("Decay", 1),
        ang: types.Number("Angle", 45),
        pen: types.Number("Penumbra", 0.5)
    });

    get light(): THREE.SpotLight
    {
        return this.object3D as THREE.SpotLight;
    }

    create()
    {
        super.create();

        this.object3D = new THREE.SpotLight();
    }

    update()
    {
        const light = this.light;
        const { col, int, dst, dcy, ang, pen } = this.ins;

        light.color.fromArray(col.value);
        light.intensity = int.value;
        light.distance = dst.value;
        light.decay = dcy.value;
        light.angle = ang.value;
        light.penumbra = pen.value;
    }

    fromData(data: ILightData)
    {
        this.ins.setValues({
            col: data.color !== undefined ? data.color.slice() : [ 1, 1, 1 ],
            int: data.intensity !== undefined ? data.intensity : 1,
            dst: data.point.distance || 0,
            dcy: data.point.decay !== undefined ? data.point.decay : 1,
            ang: data.spot.angle !== undefined ? data.spot.angle : Math.PI / 4,
            pen: data.spot.penumbra || 0
        });
    }

    toData(): ILightData
    {
        const data: Partial<ILightData> = {};
        const ins = this.ins;

        data.type = "spot";
        data.color = ins.col.value.slice() as TVector3;
        data.intensity = ins.int.value;
        data.spot = {
            distance: ins.dst.value,
            decay: ins.dcy.value,
            angle: ins.ang.value,
            penumbra: ins.pen.value
        };

        return data as ILightData;
    }
}