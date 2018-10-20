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

import Component from "@ff/core/ecs/Component";

import { IRenderer, TUnitType, TShaderType } from "common/types";
import { EShaderMode } from "../shaders/UberMaterial";

////////////////////////////////////////////////////////////////////////////////

export default class Renderer extends Component
{
    static readonly type: string = "Renderer";

    units: TUnitType = "cm";
    shader: EShaderMode = EShaderMode.Default;
    exposure: number = 1;
    gamma: number = 1;

    fromData(data: IRenderer)
    {
        this.units = data.units;
        this.shader = EShaderMode[data.shader];
        this.exposure = data.exposure;
        this.gamma = data.gamma;
    }

    toData(): IRenderer
    {
        return {
            units: this.units,
            shader: EShaderMode[this.shader] as TShaderType,
            exposure: this.exposure,
            gamma: this.gamma
        };
    }
}