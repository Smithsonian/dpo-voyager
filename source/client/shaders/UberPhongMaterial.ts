/**
 * 3D Foundation Project
 * Copyright 2019 Smithsonian Institution
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

import { MeshPhongMaterialParameters, MeshPhongMaterial, Vector3, Vector4, 
    Color, Side, FrontSide, UniformsUtils, ShaderLib } from "three";

import { Dictionary } from "@ff/core/types";

import * as fragmentShader from "!raw-loader!./uberPBRShader.frag";
import * as vertexShader from "!raw-loader!./uberPBRShader.vert";

import { EShaderMode } from "client/schema/setup";

////////////////////////////////////////////////////////////////////////////////

export { EShaderMode };

export interface IPhongUberShaderProps extends MeshPhongMaterialParameters
{
}

export default class UberPhongShader extends MeshPhongMaterial
{
    isMeshPhongMaterial: boolean;
    isUberPhongShader: boolean;

    uniforms: {
        aoMapMix: { value: Vector3 },
        cutPlaneDirection: { value: Vector4 },
        cutPlaneColor: { value: Vector3 }
    };

    defines: Dictionary<any> = {};

    vertexShader: string;
    fragmentShader: string;

    private _clayColor = new Color("#a67a6c");
    private _paramCopy: any = {};
    private _sideCopy: Side = FrontSide;

    private _aoMapMix: Vector3;
    private _cutPlaneDirection: Vector4;
    private _cutPlaneColor: Vector3;

    constructor(params?: IPhongUberShaderProps)
    {
        super();

        this.type = "UberPhongMaterial";

        this.isMeshPhongMaterial = true;
        this.isUberPhongShader = true;

        this.defines = {
            "OBJECTSPACE_NORMALMAP": false,
            "MODE_NORMALS": false,
            "MODE_XRAY": false,
            "CUT_PLANE": false
        };

        this.uniforms = UniformsUtils.merge([
            ShaderLib.phong.uniforms,
            {
                aoMapMix: { value: new Vector3(0.25, 0.25, 0.25) },
                cutPlaneDirection: { value: new Vector4(0, 0, -1, 0) },
                cutPlaneColor: { value: new Vector3(1, 0, 0) }
            }
        ]);

        this._aoMapMix = this.uniforms.aoMapMix.value;
        this._cutPlaneDirection = this.uniforms.cutPlaneDirection.value;
        this._cutPlaneColor = this.uniforms.cutPlaneColor.value;

        //this.vertexShader = ShaderLib.phong.vertexShader;
        this.vertexShader = vertexShader;
        //this.fragmentShader = ShaderLib.phong.fragmentShader;
        this.fragmentShader = fragmentShader;

        this.color = new Color(0xffffff); // diffuse

        if (params) {
            this.setValues(params);
        }
    }

    set cutPlaneDirection(direction: Vector4) {
        this._cutPlaneDirection.copy(direction);
    }
    get cutPlaneDirection() {
        return this._cutPlaneDirection;
    }

    set cutPlaneColor(color: Vector3) {
        this._cutPlaneColor.copy(color);
    }
    get cutPlaneColor() {
        return this._cutPlaneColor;
    }

    set aoMapMix(mix: Vector3) {
        this._aoMapMix.copy(mix);
    }
    get aoMapMix() {
        return this._aoMapMix;
    }
}
