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

import {
    Component,
    types
} from "@ff/graph";

import {
    IRenderContext
} from "@ff/scene/RenderSystem";

import Model from "../components/Model";
import { EShaderMode } from "../shaders/UberMaterial";
import { IRenderer, TShaderType } from "common/types";

////////////////////////////////////////////////////////////////////////////////

export { EShaderMode };

export default class Renderer extends Component
{
    static readonly type: string = "Renderer";

    ins = this.ins.append({
        shader: types.Enum("Materials.Shader", EShaderMode, EShaderMode.Default),
        exposure: types.Number("Renderer.Exposure", 1),
        gamma: types.Number("Renderer.Gamma", 1)
    });

    update()
    {
        const shader = this.ins.shader;

        if (shader.changed) {
            const index = types.getEnumIndex(EShaderMode, shader.value);
            this.system.components.getArray(Model).forEach(model => model.setShaderMode(index));
        }

        return true;
    }

    preRender(context: IRenderContext): void
    {
        if (this.updated) {
            const renderer = context.view.renderer;
            renderer.toneMappingExposure = this.ins.exposure.value;
        }
    }

    fromData(data: IRenderer)
    {
        this.ins.setValues({
            shader: EShaderMode[data.shader],
            exposure: data.exposure,
            gamma: data.gamma
        });
    }

    toData(): IRenderer
{
    const { shader, exposure, gamma } = this.ins;

    return {
        shader: EShaderMode[shader.value] as TShaderType,
        exposure: exposure.value,
        gamma: gamma.value
    };
}
}