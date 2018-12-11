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
import UniversalCamera, { ECameraType } from "@ff/three/UniversalCamera";

import { ICamera as ICameraData } from "common/types/presentation";
import Object3D from "./Object3D";

////////////////////////////////////////////////////////////////////////////////

export { ECameraType };

export default class Camera extends Object3D
{
    static readonly type: string = "Camera";

    ins = this.ins.append({
        projection: types.Enum("Projection", ECameraType),
        fovY: types.Number("FovY", 50),
        size: types.Number("Size", 50),
        zNear: types.Number("Frustum.Near", 0.001),
        zFar: types.Number("Frustum.Far", 10000)
    });

    get camera(): UniversalCamera
    {
        return this.object3D as UniversalCamera;
    }

    create()
    {
        super.create();
        this.object3D = new UniversalCamera();
    }

    update()
    {
        const { projection, fovY, size, zNear, zFar } = this.ins;

        const camera = this.camera;
        camera.setType(projection.value);
        camera.fov = fovY.value;
        camera.size = size.value;
        camera.near = zNear.value;
        camera.far = zFar.value;
        camera.updateProjectionMatrix();
    }

    fromData(data: ICameraData)
    {
        if (data.type === "perspective") {
            this.ins.setValuesByKey({
                projection: ECameraType.Perspective,
                fovY: data.perspective.yfov,
                zNear: data.perspective.znear,
                zFar: data.perspective.zfar
            });
        }
        else {
            this.ins.setValuesByKey({
                projection: ECameraType.Orthographic,
                size: data.orthographic.ymag,
                zNear: data.orthographic.znear,
                zFar: data.orthographic.zfar
            });
        }
    }

    toData(): ICameraData
    {
        const data: Partial<ICameraData> = {};
        const ins = this.ins;

        if (types.isEnumEntry(ECameraType.Perspective, ins.projection.value)) {
            data.type = "perspective";
            data.perspective = {
                yfov: ins.fovY.value,
                znear: ins.zNear.value,
                zfar: ins.zFar.value
            };
        }
        else {
            data.type = "orthographic";
            data.orthographic = {
                ymag: ins.size.value,
                znear: ins.zNear.value,
                zfar: ins.zFar.value
            }
        }

        return data as ICameraData;
    }
}