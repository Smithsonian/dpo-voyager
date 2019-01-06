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

import DirectionalLightComponent from "@ff/scene/components/DirectionalLight";

import { ILight } from "common/types/presentation";

import Light from "./Light";

////////////////////////////////////////////////////////////////////////////////

/**
 * Presentation node representing a directional light source.
 */
export default class DirectionalLight extends Light
{
    static readonly type: string = "DirectionalLight";

    protected light: DirectionalLightComponent = null;

    createComponents()
    {
        super.createComponents();
        this.light = this.createComponent(DirectionalLightComponent);
        this.name = "DirectionalLight";
    }

    fromLightData(data: ILight)
    {
        this.light.ins.setPropertyValues({
            color: data.color !== undefined ? data.color.slice() : [ 1, 1, 1 ],
            intensity: data.intensity !== undefined ? data.intensity : 1,
            position: [ 0, 0, 0 ],
            target: [ 0, 0, 0 ]
        });
    }

    toLightData(): ILight
    {
        const data = super.toLightData();
        data.type = "directional";
        return data;
    }
}