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
import Object3D from "@ff/scene/components/Object3D";

import { ILight, TVector3 } from "common/types/presentation";

////////////////////////////////////////////////////////////////////////////////

export default class PLight extends Object3D
{
    static readonly type: string = "PLight";

    ins = this.ins.append({
        color: types.ColorRGB("Color"),
        intensity: types.Number("Intensity", 1)
    });

    get light(): THREE.Light
    {
        return this.object3D as THREE.Light;
    }

    fromData(data: ILight)
    {

    }

    toData(): ILight
    {
        const data: Partial<ILight> = {};
        const ins = this.ins;

        data.color = ins.color.value.slice() as TVector3;
        data.intensity = ins.intensity.value;

        return data as ILight;
    }
}