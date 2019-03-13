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

import CMaterial, { types } from "@ff/scene/components/CMaterial";
import CTexture from "@ff/scene/components/CTexture";

import UberPBRMaterial from "../shaders/UberPBRMaterial";

////////////////////////////////////////////////////////////////////////////////

export enum ENormalMapSpace { Tangent, Object }

export default class CVUberMaterial extends CMaterial
{
    static readonly typeName: string = "CVUberMaterial";

    protected static readonly ins = {
        color: types.ColorRGB("PBR.BaseColor"),
        roughness: types.Percent("PBR.Roughness", 0.5),
        metalness: types.Percent("PBR.Metalness", 0.2),
        colorMap: types.Object("Maps.Color", CTexture),
        occlusionMap: types.Object("Maps.Occlusion", CTexture),
        emissiveMap: types.Object("Maps.Emissive", CTexture),
        metallicRoughnessMap: types.Object("Maps.MetallicRoughness", CTexture),
        normalMap: types.Object("Maps.Normal", CTexture),
        normalSpace: types.Enum("Maps.NormalSpace", ENormalMapSpace),
    };

    ins = this.addInputs<CMaterial, typeof CVUberMaterial.ins>(CVUberMaterial.ins);

    get material() {
        return this._material as UberPBRMaterial;
    }

    update()
    {
        super.update();

        return true;
    }

    setFromStandardMaterial(material: THREE.MeshStandardMaterial)
    {
        this._material = material;

        if (material.name) {
            this.name = material.name;
        }
    }
}