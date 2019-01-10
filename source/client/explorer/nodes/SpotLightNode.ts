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

import SpotLight from "@ff/scene/components/SpotLight";

import { ILight } from "common/types/presentation";

import LightNode from "./LightNode";

////////////////////////////////////////////////////////////////////////////////

/**
 * Presentation node representing a spot light source.
 */
export default class SpotLightNode extends LightNode
{
    static readonly type: string = "SpotLightNode";

    protected light: SpotLight = null;

    createComponents()
    {
        super.createComponents();
        this.light = this.createComponent(SpotLight);
        this.name = "SpotLight";
    }

    fromLightData(data: ILight)
    {
        this.light.ins.copyValues({
            color: data.color !== undefined ? data.color.slice() : [ 1, 1, 1 ],
            intensity: data.intensity !== undefined ? data.intensity : 1,
            distance: data.point.distance || 0,
            decay: data.point.decay !== undefined ? data.point.decay : 1,
            angle: data.spot.angle !== undefined ? data.spot.angle : Math.PI / 4,
            penumbra: data.spot.penumbra || 0
        });
    }

    toLightData(): ILight
    {
        const ins = this.light.ins;
        const data = super.toLightData();

        data.type = "spot";
        data.spot = {
            distance: ins.distance.value,
            decay: ins.decay.value,
            angle: ins.angle.value,
            penumbra: ins.penumbra.value
        };

        return data;
    }
}