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
import Component, { IPublisherEvent } from "@ff/core/ecs/Component";
import { EQuadViewLayout } from "@ff/three/ecs/RenderQuadView";

import { IRenderer, TShaderType } from "common/types";

import { EShaderMode } from "../shaders/UberMaterial";

import Model from "./Model";

////////////////////////////////////////////////////////////////////////////////

const _vec3 = new THREE.Vector3();
const _mat4 = new THREE.Matrix4();

export { EQuadViewLayout, EShaderMode };


export default class Renderer extends Component
{
    static readonly type: string = "Renderer";

    ins = this.ins.append({
        layout: types.Enum("Viewport.Layout", EQuadViewLayout, EQuadViewLayout.Single),
        grid: types.Boolean("Viewport.HomeGrid"),
        shader: types.Enum("Materials.Shader", EShaderMode, EShaderMode.Default),
        exposure: types.Number("Renderer.Exposure", 1),
        gamma: types.Number("Renderer.Gamma", 1)
    });

    constructor(id?: string)
    {
        super(id);
        this.addEvents("viewports", "renderer");
    }

    update()
    {
        const shader = this.ins.shader;

        if (shader.changed) {
            const index = types.getEnumEntry(EShaderMode, shader.value);
            this.system.getComponents(Model).forEach(model => model.setShaderMode(index));
        }
    }

    fromData(data: IRenderer)
    {
        this.ins.setValues({
            sha: EShaderMode[data.shader],
            exp: data.exposure,
            gam: data.gamma
        });
    }

    toData(): IRenderer
    {
        const { sha, exp, gam } = this.ins;

        return {
            shader: EShaderMode[sha.value] as TShaderType,
            exposure: exp.value,
            gamma: gam.value
        };
    }
}