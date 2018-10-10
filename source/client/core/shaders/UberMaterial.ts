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

import { Vector2 } from 'three/src/math/Vector2';
import { Vector3 } from 'three/src/math/Vector3';
import { Color } from 'three/src/math/Color';
import { UniformsUtils } from 'three/src/renderers/shaders/UniformsUtils';
import { ShaderLib } from 'three/src/renderers/shaders/ShaderLib';

import * as fragmentShader from "!raw-loader!./uberShader.frag";
import * as vertexShader from "!raw-loader!./uberShader.vert";

import { IUniform, Texture } from "three/three-core";
import { Material, MeshStandardMaterialParameters } from "three";

////////////////////////////////////////////////////////////////////////////////

export default class UberMaterial extends Material
{
    isMeshStandardMaterial: boolean;
    isMeshPhysicalMaterial: boolean;
    isUberMaterial: boolean;

    defines: any;
    uniforms: { [uniform: string]: IUniform };
    vertexShader: string;
    fragmentShader: string;

    color: Color;
    roughness: number;
    metalness: number;
    map: Texture;
    lightMap: Texture;
    lightMapIntensity: number;
    aoMap: Texture;
    aoMapIntensity: number;
    emissive: Color;
    emissiveIntensity: number;
    emissiveMap: Texture;
    bumpMap: Texture;
    bumpScale: number;
    normalMap: Texture;
    normalScale: Vector2;
    displacementMap: Texture;
    displacementScale: number;
    displacementBias: number;
    roughnessMap: Texture;
    metalnessMap: Texture;
    alphaMap: Texture;
    envMap: Texture;
    envMapIntensity: number;
    refractionRatio: number;
    wireframe: boolean;
    wireframeLinewidth: number;
    wireframeLinecap: string;
    wireframeLinejoin: string;
    skinning: boolean;
    morphTargets: boolean;
    morphNormals: boolean;

    constructor(params?: MeshStandardMaterialParameters)
    {
        super();

        this.type = "UberMaterial";
        this.isMeshStandardMaterial = true;
        this.isUberMaterial = true;

        this.defines = {
            "PHYSICAL": true,
            "USE_OBJECTSPACE_NORMALMAP": false
        };

        this.uniforms = UniformsUtils.merge([
            ShaderLib.standard.uniforms,
            {
                aoMapMix: { value: new Vector3(0.3, 0.3, 0.3) }
            },
        ]);

        //this.vertexShader = ShaderLib.standard.vertexShader;
        this.vertexShader = vertexShader;

        //this.fragmentShader = ShaderLib.standard.fragmentShader;
        this.fragmentShader = fragmentShader;

        this.color = new Color(0xffffff); // diffuse
        this.roughness = 0.5;
        this.metalness = 0.5;

        this.map = null;

        this.lightMap = null;
        this.lightMapIntensity = 1.0;

        this.aoMap = null;
        this.aoMapIntensity = 1.0;

        this.emissive = new Color(0x000000);
        this.emissiveIntensity = 1.0;
        this.emissiveMap = null;

        this.bumpMap = null;
        this.bumpScale = 1;

        this.normalMap = null;
        this.normalScale = new Vector2(1, 1);

        this.displacementMap = null;
        this.displacementScale = 1;
        this.displacementBias = 0;

        this.roughnessMap = null;

        this.metalnessMap = null;

        this.alphaMap = null;

        this.envMap = null;
        this.envMapIntensity = 1.0;

        this.refractionRatio = 0.98;

        this.wireframe = false;
        this.wireframeLinewidth = 1;
        this.wireframeLinecap = 'round';
        this.wireframeLinejoin = 'round';

        this.skinning = false;
        this.morphTargets = false;
        this.morphNormals = false;

        if (params) {
            this.setValues(params);
        }
    }

    setOcclusionMix(mix: number[])
    {
        this.uniforms["aoMapMix"].value.set(mix[0], mix[1], mix[2]);
    }

    setNormalMapObjectSpace(useObjectSpace: boolean)
    {
        if (this.defines["USE_OBJECTSPACE_NORMALMAP"] !== useObjectSpace) {
            this.needsUpdate = true;
        }

        this.defines["USE_OBJECTSPACE_NORMALMAP"] = useObjectSpace;
    }

    copy(material: THREE.MeshStandardMaterial): this
    {
        this.color = material.color;

        this.roughness = material.roughness;
        this.roughnessMap = material.roughnessMap;

        this.metalness = material.metalness;
        this.metalnessMap = material.metalnessMap;

        this.map = material.map;
        this.aoMap = material.aoMap;
        this.aoMapIntensity = material.aoMapIntensity;

        this.normalMap = material.normalMap;

        return this;
    }
}