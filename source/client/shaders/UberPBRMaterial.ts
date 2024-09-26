/**
 * 3D Foundation Project
 * Copyright 2024 Smithsonian Institution
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

import { MeshStandardMaterialParameters, MeshStandardMaterial, Vector3, Vector4, Color, 
    Side, UniformsUtils, ShaderLib, NoBlending, DoubleSide, AdditiveBlending, FrontSide, Texture, ObjectSpaceNormalMap } from "three";

const fragmentShader = require("./uberPBRShader.frag").default;
const vertexShader = require("./uberPBRShader.vert").default;

import { EShaderMode } from "client/schema/setup";

////////////////////////////////////////////////////////////////////////////////

export { EShaderMode };

export interface IUberPBRShaderProps extends MeshStandardMaterialParameters
{

}

export default class UberPBRMaterial extends MeshStandardMaterial
{
    readonly isUberPBRMaterial = true;
    readonly isMeshStandardMaterial = true;
    readonly isMeshPhysicalMaterial = false;

    uniforms: {
        aoMapMix: { value: Vector3 },
        cutPlaneDirection: { value: Vector4 },
        cutPlaneColor: { value: Vector3 },
        zoneMap: { value: Texture }
    };

    vertexShader: string;
    fragmentShader: string;

    private _clayColor = new Color("#a67a6c").convertLinearToSRGB();
    private _wireColor = new Color("#004966").convertLinearToSRGB();
    private _wireEmissiveColor = new Color("#004966").convertLinearToSRGB();
    private _objectSpaceNormalMap = false;
    private _paramCopy: any = {};
    private _sideCopy: Side = FrontSide;

    private _aoMapMix: Vector3;
    private _cutPlaneDirection: Vector4;
    private _cutPlaneColor: Vector3;
    private _zoneMap: Texture;

    constructor(params?: IUberPBRShaderProps)
    {
        super();

        this.type = "UberPBRMaterial";

        this.defines = {
            "STANDARD": true,
            "PHYSICAL": false,
            "OBJECTSPACE_NORMALMAP": false,
            "MODE_NORMALS": false,
            "MODE_XRAY": false,
            "CUT_PLANE": false,
            "USE_ZONEMAP": false,
            "OVERLAY_ALPHA": false
        };

        this.uniforms = UniformsUtils.merge([
            ShaderLib.standard.uniforms,
            {
                aoMapMix: { value: new Vector3(0.25, 0.25, 0.25) },
                cutPlaneDirection: { value: new Vector4(0, 0, -1, 0) },
                cutPlaneColor: { value: new Vector3(1, 0, 0) },
                zoneMap: { value: null },
            }
        ]) as any;

        this._aoMapMix = this.uniforms.aoMapMix.value;
        this._cutPlaneDirection = this.uniforms.cutPlaneDirection.value;
        this._cutPlaneColor = this.uniforms.cutPlaneColor.value;
        this._zoneMap = this.uniforms.zoneMap.value;

        //this.vertexShader = ShaderLib.standard.vertexShader;
        this.vertexShader = vertexShader;
        //this.fragmentShader = ShaderLib.standard.fragmentShader;
        this.fragmentShader = fragmentShader;

        this.color = new Color(0xffffff); // diffuse
        this.roughness = 0.7;
        this.metalness = 0.0;

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

    set zoneMap(map) {
        this._zoneMap = map;
        this.uniforms.zoneMap.value = map;
        this.needsUpdate = true;
    }
    get zoneMap() {
        return this._zoneMap;
    }

    setShaderMode(mode: EShaderMode)
    {
        Object.assign(this, this._paramCopy);

        this.defines["MODE_NORMALS"] = false;
        this.defines["MODE_XRAY"] = false;
        this.defines["OBJECTSPACE_NORMALMAP"] = !!(this.normalMap && this._objectSpaceNormalMap);

        this.side = this.defines["CUT_PLANE"] ? DoubleSide : this.side;

        this.needsUpdate = true;

        switch(mode) {
            case EShaderMode.Clay:
                this._paramCopy = {
                    color: this.color,
                    map: this.map,
                    roughness: this.roughness,
                    metalness: this.metalness,
                    aoMapIntensity: this.aoMapIntensity,
                    blending: this.blending,
                    transparent: this.transparent,
                    depthWrite: this.depthWrite,
                };
                this.color = this._clayColor;
                this.map = null;
                this.roughness = 1;
                this.metalness = 0;
                this.aoMapIntensity *= 1;
                this.blending = NoBlending;
                this.transparent = false;
                this.depthWrite = true;
                break;

            case EShaderMode.Normals:
                this._paramCopy = {
                    blending: this.blending,
                    transparent: this.transparent,
                    depthWrite: this.depthWrite,
                };
                this.defines["MODE_NORMALS"] = true;
                this.blending = NoBlending;
                this.transparent = false;
                this.depthWrite = true;
                break;

            case EShaderMode.XRay:
                this._paramCopy = {
                    side: this.side,
                    blending: this.blending,
                    transparent: this.transparent,
                    depthWrite: this.depthWrite,
                };
                this.defines["MODE_XRAY"] = true;
                this.side = DoubleSide;
                this.blending = AdditiveBlending;
                this.transparent = true;
                this.depthWrite = false;
                break;

            case EShaderMode.Wireframe:
                this._paramCopy = {
                    color: this.color,
                    emissive: this.emissive,
                    roughness: this.roughness,
                    metalness: this.metalness,
                    wireframe: this.wireframe,
                    map: this.map,
                    aoMap: this.aoMap,
                    emissiveMap: this.emissiveMap,
                    normalMap: this.normalMap,
                };
                this.color = this._wireColor;
                this.emissive = this._wireEmissiveColor;
                this.roughness = 0.8;
                this.metalness = 0.1;
                this.wireframe = true;
                this.map = null;
                this.aoMap = null;
                this.emissiveMap = null;
                this.normalMap = null;
                this.defines["OBJECTSPACE_NORMALMAP"] = false;
                break;
        }
    }

    enableCutPlane(enabled: boolean)
    {
        this.defines["CUT_PLANE"] = enabled;

        if (enabled) {
            this._sideCopy = this.side;
            this.side = DoubleSide;
        }
        else {
            this.side = this._sideCopy;
        }
    }

    enableObjectSpaceNormalMap(useObjectSpace: boolean)
    {
        if (useObjectSpace !== this._objectSpaceNormalMap) {
            this._objectSpaceNormalMap = useObjectSpace;
        }

        if (this.normalMap) {
            this.normalMapType = ObjectSpaceNormalMap;
            this.needsUpdate = true;
        }
    }

    enableZoneMap(enabled: boolean) {
        this.defines["USE_ZONEMAP"] = enabled;
    }

    // enable black-to-alpha blending for overlays
    enableOverlayAlpha(enabled: boolean) {
        this.defines["OVERLAY_ALPHA"] = enabled;
    }
}