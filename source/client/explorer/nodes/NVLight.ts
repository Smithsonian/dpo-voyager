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

import CLight from "@ff/scene/components/CLight";

import { ILight, TVector3 } from "common/types/presentation";

import NVNode from "./NVNode";

////////////////////////////////////////////////////////////////////////////////

export default class NVLight extends NVNode
{
    static readonly typeName: string = "NVLight";

    get light() {
        return this.components.get(CLight);
    }

    fromLightData(data: ILight)
    {
        this.light.ins.copyValues({
            color: data.color !== undefined ? data.color : [ 1, 1, 1 ],
            intensity: data.intensity !== undefined ? data.intensity : 1,
        });
    }

    toLightData(): ILight
    {
        const ins = this.light.ins;

        return {
            color: ins.color.cloneValue() as TVector3,
            intensity: ins.intensity.value,
        } as ILight;
    }
}