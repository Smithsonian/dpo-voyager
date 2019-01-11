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

import CPointLight from "@ff/scene/components/CPointLight";

import { ILight } from "common/types/presentation";

import NLightNode from "./NLightNode";

////////////////////////////////////////////////////////////////////////////////

/**
 * Presentation node representing a point light source.
 */
export default class NPointLightNode extends NLightNode
{
    static readonly type: string = "NPointLightNode";

    protected light: CPointLight = null;

    createComponents()
    {
        super.createComponents();
        this.light = this.createComponent(CPointLight);
        this.name = "PointLight";
    }

    fromLightData(data: ILight)
    {
        this.light.ins.copyValues({
            color: data.color !== undefined ? data.color.slice() : [ 1, 1, 1 ],
            intensity: data.intensity !== undefined ? data.intensity : 1,
            distance: data.point.distance || 0,
            decay: data.point.decay !== undefined ? data.point.decay : 1
        });
    }

    toLightData(): ILight
    {
        const ins = this.light.ins;
        const data = super.toLightData();

        data.type = "point";
        data.point = {
            distance: ins.distance.value,
            decay: ins.decay.value
        };

        return data;
    }
}