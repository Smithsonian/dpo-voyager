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

import { UniformsUtils } from 'three/src/renderers/shaders/UniformsUtils';
import { ShaderLib } from 'three/src/renderers/shaders/ShaderLib';

import * as fragmentShader from "!raw-loader!./uberShader.frag";
import * as vertexShader from "!raw-loader!./uberShader.vert";

import { IUniform, Texture } from "three/three-core";
import { Material, MeshStandardMaterialParameters } from "three";

////////////////////////////////////////////////////////////////////////////////

export enum EShaderMode { Inherit, Default, PBR, Phong, Clay, Normals, Wireframe, XRay }


export default class UberMaterial extends Material
{
    isMeshStandardMaterial: boolean;
    isMeshPhysicalMaterial: boolean;
    isUberMaterial: boolean;

    defines: any;
    uniforms: { [uniform: string]: IUniform };
    vertexShader: string;
    fragmentShader: string;

    color: THREE.Color;
    roughness: number;
    metalness: number;
    map: Texture;
    lightMap: Texture;
    lightMapIntensity: number;
    aoMap: Texture;
    aoMapIntensity: number;
    emissive: THREE.Color;
    emissiveIntensity: number;
    emissiveMap: Texture;
    bumpMap: Texture;
    bumpScale: number;
    normalMap: Texture;
    normalScale: THREE.Vector2;
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

    protected _params: any = {};
    protected _clayColor = new THREE.Color("#a67a6c");

    constructor(params?: MeshStandardMaterialParameters)
    {
        super();

        this.type = "UberMaterial";
        this.isMeshStandardMaterial = true;
        this.isUberMaterial = true;

        this.defines = {
            "PHYSICAL": true,
            "USE_OBJECTSPACE_NORMALMAP": false,
            "MODE_NORMALS": false,
            "MODE_XRAY": false
        };

        this.uniforms = UniformsUtils.merge([
            ShaderLib.standard.uniforms,
            {
                aoMapMix: { value: new THREE.Vector3(0.25, 0.25, 0.25) }
            },
        ]);

        //this.vertexShader = ShaderLib.standard.vertexShader;
        this.vertexShader = vertexShader;

        //this.fragmentShader = ShaderLib.standard.fragmentShader;
        this.fragmentShader = fragmentShader;

        this.color = new THREE.Color(0xffffff); // diffuse
        this.roughness = 0.7;
        this.metalness = 0.0;

        this.map = null;

        this.lightMap = null;
        this.lightMapIntensity = 1.0;

        this.aoMap = null;
        this.aoMapIntensity = 1.0;

        this.emissive = new THREE.Color(0x000000);
        this.emissiveIntensity = 1.0;
        this.emissiveMap = null;

        this.bumpMap = null;
        this.bumpScale = 1;

        this.normalMap = null;
        this.normalScale = new THREE.Vector2(1, 1);

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

    setShaderMode(mode: EShaderMode)
    {
        Object.assign(this, this._params);
        this.defines["MODE_NORMALS"] = false;
        this.defines["MODE_XRAY"] = false;
        this.needsUpdate = true;

        switch(mode) {
            case EShaderMode.Clay:
                this._params = {
                    color: this.color,
                    map: this.map,
                    roughness: this.roughness,
                    metalness: this.metalness,
                    aoMapIntensity: this.aoMapIntensity,
                    side: this.side,
                    blending: this.blending,
                    transparent: this.transparent,
                    depthWrite: this.depthWrite
                };
                this.color = this._clayColor;
                this.map = null;
                this.roughness = 1;
                this.metalness = 0;
                this.aoMapIntensity *= 1;
                this.side = THREE.FrontSide;
                this.blending = THREE.NoBlending;
                this.transparent = false;
                this.depthWrite = true;
                break;

            case EShaderMode.Normals:
                this._params = {
                    side: this.side,
                    blending: this.blending,
                    transparent: this.transparent,
                    depthWrite: this.depthWrite
                };
                this.defines["MODE_NORMALS"] = true;
                this.side = THREE.FrontSide;
                this.blending = THREE.NoBlending;
                this.transparent = false;
                this.depthWrite = true;
                break;

            case EShaderMode.XRay:
                this._params = {
                    side: this.side,
                    blending: this.blending,
                    transparent: this.transparent,
                    depthWrite: this.depthWrite
                };
                this.defines["MODE_XRAY"] = true;
                this.side = THREE.DoubleSide;
                this.blending = THREE.AdditiveBlending;
                this.transparent = true;
                this.depthWrite = false;
                break;

            case EShaderMode.Wireframe:
                this._params = {
                    wireframe: this.wireframe
                };
                this.wireframe = true;
                break;
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

    copyStandardMaterial(material: THREE.MeshStandardMaterial): this
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