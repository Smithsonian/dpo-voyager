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

import { ICamera as ICameraData } from "common/types/presentation";

import Object3D from "./Object3D";

////////////////////////////////////////////////////////////////////////////////

export default class Camera extends Object3D
{
    static readonly type: string = "Camera";

    private static _proj = [ "perspective", "orthographic" ];

    ins = this.makeProps({
        pro: types.Enum("Type", Camera._proj),
        fov: types.Number("FovY", 50),
        siz: types.Number("Size", 20),
        zn: types.Number("Frustum.Near", 0.001),
        zf: types.Number("Frustum.Far", 10000)
    });

    get camera(): THREE.Camera
    {
        return this.object3D as THREE.Camera;
    }

    update()
    {
        const { pro, fov, siz, zn, zf } = this.ins;

        const camera = this.camera;
        const aspect = camera ? camera.userData["aspect"] : 1;
        const hh = siz.value * 0.5;
        const hw = hh * aspect;

        if (pro.changed) {
            this.object3D = pro.value < 1
                ? new THREE.PerspectiveCamera(fov.value, aspect, zn.value, zf.value)
                : new THREE.OrthographicCamera(-hw, hw, hh, -hh, zn.value, zf.value);

            this.object3D.userData["aspect"] = aspect;
        }
        else {
            if (camera.type === "PerspectiveCamera") {
                const perspCam = camera as THREE.PerspectiveCamera;
                perspCam.fov = fov.value;
                perspCam.near = zn.value;
                perspCam.far = zf.value;
                perspCam.updateProjectionMatrix();
            }
            else if (camera.type === "OrthographicCamera") {
                const orthoCam = camera as THREE.OrthographicCamera;
                orthoCam.left = -hw;
                orthoCam.right = hw;
                orthoCam.top = hh;
                orthoCam.bottom = -hh;
                orthoCam.near = zn.value;
                orthoCam.far = zf.value;
                orthoCam.updateProjectionMatrix();
            }
        }
    }

    fromData(data: ICameraData)
    {
        if (data.type === "perspective") {
            this.ins.setValues({
                pro: 0,
                fov: data.perspective.yfov,
                zn: data.perspective.znear,
                zf: data.perspective.zfar
            });
        }
        else {
            this.ins.setValues({
                pro: 1,
                siz: data.orthographic.ymag,
                zn: data.orthographic.znear,
                zf: data.orthographic.zfar
            });
        }
    }

    toData(): ICameraData
    {
        const data: Partial<ICameraData> = {};
        const ins = this.ins;

        if (ins.pro.value < 1) {
            data.type = "perspective";
            data.perspective = {
                yfov: ins.fov.value,
                znear: ins.zn.value,
                zfar: ins.zf.value
            };
        }
        else {
            data.type = "orthographic";
            data.orthographic = {
                ymag: ins.siz.value,
                znear: ins.zn.value,
                zfar: ins.zf.value
            }
        }

        return data as ICameraData;
    }
}