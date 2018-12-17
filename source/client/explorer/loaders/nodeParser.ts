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

import math from "@ff/core/math";
import { types } from "@ff/graph/propertyTypes";

import Transform from "@ff/scene/components/Transform";
import Camera from "@ff/scene/components/Camera";
import Light from "@ff/scene/components/Light";
import DirectionalLight from "@ff/scene/components/DirectionalLight";
import PointLight from "@ff/scene/components/PointLight";
import SpotLight from "@ff/scene/components/SpotLight";

import {
    ITransform,
    ICamera,
    ILight, INode as ITransformData, ICamera as ICameraData, ILight as ILightData, TVector3
} from "common/types/presentation";
import { EProjection } from "@ff/three/UniversalCamera";


////////////////////////////////////////////////////////////////////////////////

const _vec3a = new THREE.Vector3();
const _vec3b = new THREE.Vector3();
const _mat4 = new THREE.Matrix4();
const _quat = new THREE.Quaternion();
const _euler = new THREE.Euler();

export default {

    dataToTransform: function(data: ITransform, transform: Transform) {

        const { position, rotation, order, scale } = transform.ins;

        order.setValue(0);

        if (data.matrix) {
            _mat4.fromArray(data.matrix);
            _mat4.decompose(_vec3a, _quat, _vec3b);
            _vec3a.toArray(position.value);
            _euler.setFromQuaternion(_quat, "XYZ");
            _euler.toVector3(_vec3a).multiplyScalar(math.RAD2DEG).toArray(rotation.value);
            _vec3b.toArray(scale.value);

            position.set();
            rotation.set();
            scale.set();
        }
        else {
            if (data.translation) {
                position.setValue(data.translation.slice());
            }
            if (data.rotation) {
                _quat.fromArray(data.rotation);
                _euler.setFromQuaternion(_quat, "XYZ");
                _euler.toVector3(_vec3a).multiplyScalar(math.RAD2DEG).toArray(rotation.value);
                rotation.set();
            }
            if (data.scale) {
                scale.setValue(data.scale.slice());
            }

            // this updates the matrix from the PRS properties
            transform.changed = true;
        }
    },
    transformToData: function(transform: Transform): ITransform {

        transform.object3D.matrix.decompose(_vec3a, _quat, _vec3b);

        const data: Partial<ITransformData> = {};

        if (_vec3a.x !== 0 || _vec3a.y !== 0 || _vec3a.z !== 0) {
            data.translation = _vec3a.toArray();
        }
        if (_quat.x !== 0 || _quat.y !== 0 || _quat.z !== 0 || _quat.w !== 1) {
            data.rotation = _quat.toArray();
        }
        if (_vec3b.x !== 1 || _vec3b.y !== 1 || _vec3b.z !== 1) {
            data.scale = _vec3b.toArray();
        }

        return data;
    },

    dataToCamera: function(data: ICamera, camera: Camera) {

        if (data.type === "perspective") {
            camera.ins.setValuesByKey({
                projection: EProjection.Perspective,
                fov: data.perspective.yfov,
                near: data.perspective.znear,
                far: data.perspective.zfar
            });
        }
        else {
            camera.ins.setValuesByKey({
                projection: EProjection.Orthographic,
                size: data.orthographic.ymag,
                near: data.orthographic.znear,
                far: data.orthographic.zfar
            });
        }
    },
    cameraToData: function(camera: Camera): ICamera {

        const data: Partial<ICameraData> = {};
        const ins = camera.ins;

        if (types.isEnumIndex(EProjection.Perspective, ins.projection.value)) {
            data.type = "perspective";
            data.perspective = {
                yfov: ins.fov.value,
                znear: ins.near.value,
                zfar: ins.far.value
            };
        }
        else {
            data.type = "orthographic";
            data.orthographic = {
                ymag: ins.size.value,
                znear: ins.near.value,
                zfar: ins.far.value
            }
        }

        return data as ICameraData;
    },

    dataToPointLight: function(data: ILight, light: PointLight) {

        light.ins.setValuesByKey({
            color: data.color !== undefined ? data.color.slice() : [ 1, 1, 1 ],
            intensity: data.intensity !== undefined ? data.intensity : 1,
            distance: data.point.distance || 0,
            decay: data.point.decay !== undefined ? data.point.decay : 1
        });
    },
    dataToDirectionalLight: function(data: ILight, light: DirectionalLight) {

        light.ins.setValuesByKey({
            color: data.color !== undefined ? data.color.slice() : [ 1, 1, 1 ],
            intensity: data.intensity !== undefined ? data.intensity : 1,
            position: [ 0, 0, 0 ],
            target: [ 0, 0, 0 ]
        });
    },
    dataToSpotLight: function(data: ILight, light: SpotLight) {

        light.ins.setValuesByKey({
            color: data.color !== undefined ? data.color.slice() : [ 1, 1, 1 ],
            intensity: data.intensity !== undefined ? data.intensity : 1,
            distance: data.point.distance || 0,
            decay: data.point.decay !== undefined ? data.point.decay : 1,
            angle: data.spot.angle !== undefined ? data.spot.angle : Math.PI / 4,
            penumbra: data.spot.penumbra || 0
        });
    },

    lightToData: function(light: Light): ILight {

        const data: Partial<ILightData> = {};
        const ins = light.ins;

        data.color = ins.color.value.slice() as TVector3;
        data.intensity = ins.intensity.value;

        if (light instanceof DirectionalLight) {
            data.type = "directional";

        }
        else if (light instanceof PointLight) {
            data.type = "point";
            data.point = {
                distance: ins.distance.value,
                decay: ins.decay.value
            };
        }
        else if (light instanceof SpotLight) {
            data.type = "spot";
            data.spot = {
                distance: ins.distance.value,
                decay: ins.decay.value,
                angle: ins.angle.value,
                penumbra: ins.penumbra.value
            };
        }
        else {
            throw Error("unknown light component type");
        }


        return data as ILightData;
    }
}