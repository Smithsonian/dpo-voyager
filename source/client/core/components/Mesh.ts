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

import { GeometryObject, MaterialObject } from "../system/propertyObjectTypes";
import Object3D from "./Object3D";

////////////////////////////////////////////////////////////////////////////////

export default class MeshComponent extends Object3D
{
    static readonly type: string = "Mesh";

    ins = this.makeProps({
        geo: types.Object("Geometry", GeometryObject),
        mat: types.Object("Material", MaterialObject)
    });

    create()
    {
        super.create();

        this.object3D = new THREE.Mesh();
        this.object3D.matrixAutoUpdate = false;
    }

    update()
    {
        const { geo, mat } = this.ins;

        if (geo.changed) {
            this.mesh.geometry = geo.value.object;
        }
        if (mat.changed) {
            this.mesh.material = mat.value.object as THREE.MeshBasicMaterial;
        }
    }

    get mesh(): THREE.Mesh
    {
        return this.object3D as THREE.Mesh;
    }
}