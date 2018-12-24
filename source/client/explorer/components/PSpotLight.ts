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

import { types } from "@ff/graph/propertyTypes";

import { ILight } from "common/types/presentation";
import PLight from "./PLight";

////////////////////////////////////////////////////////////////////////////////

export default class PSpotLight extends PLight
{
    static readonly type: string = "PSpotLight";

    ins = this.ins.append({
        distance: types.Number("Distance"),
        decay: types.Number("Decay", 1),
        angle: types.Number("Angle", 45),
        penumbra: types.Number("Penumbra", 0.5)
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
        const { color, intensity, distance, decay, angle, penumbra } = this.ins;

        light.color.fromArray(color.value);
        light.intensity = intensity.value;
        light.distance = distance.value;
        light.decay = decay.value;
        light.angle = angle.value;
        light.penumbra = penumbra.value;

        light.updateMatrix();
        return true;
    }

    fromData(data: ILight)
    {
        this.ins.setValuesByKey({
            color: data.color !== undefined ? data.color.slice() : [ 1, 1, 1 ],
            intensity: data.intensity !== undefined ? data.intensity : 1,
            distance: data.point.distance || 0,
            decay: data.point.decay !== undefined ? data.point.decay : 1,
            angle: data.spot.angle !== undefined ? data.spot.angle : Math.PI / 4,
            penumbra: data.spot.penumbra || 0
        });
    }

    toData(): ILight
    {
        const data = super.toData();
        const ins = this.ins;

        data.type = "spot";
        data.spot = {
            distance: ins.distance.value,
            decay: ins.decay.value,
            angle: ins.angle.value,
            penumbra: ins.penumbra.value
        };

        return data as ILight;
    }
}