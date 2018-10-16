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

import math from "@ff/three/math";
import types from "@ff/core/ecs/propertyTypes";
import OrbitManipController from "@ff/react/OrbitManip";

import Manip, { IViewportPointerEvent, IViewportTriggerEvent } from "./Manip";

////////////////////////////////////////////////////////////////////////////////

const _orientation = new THREE.Vector3();
const _offset = new THREE.Vector3();
const _matrix = new THREE.Matrix4();

export default class OrbitManip extends Manip
{
    static readonly type: string = "OrbitManip";

    ins = this.makeProps({
        ori: types.Vector3("Orientation"),
        ofs: types.Vector3("Offset", [ 0, 0, 50 ])
    });

    outs = this.makeProps({
        ori: types.Vector3("Orientation"),
        ofs: types.Vector3("Offset"),
        mat: types.Matrix4("Matrix"),
        ior: types.Vector3("Inverse.Orbit")
    });

    protected manip = new OrbitManipController();

    protected viewportWidth: number = 100;
    protected viewportHeight: number = 100;

    update()
    {
        const { ori, ofs, mat, ior } = this.outs;

        ori.value = this.ins.ori.value.slice();
        ofs.value = this.ins.ofs.value.slice();

        _orientation.fromArray(ori.value);
        _orientation.multiplyScalar(math.DEG2RAD);

        _offset.fromArray(ofs.value);

        math.composeOrbitMatrix(_orientation, _offset, _matrix);
        (_matrix as any).toArray(mat.value);

        ior.value[0] = -ori.value[0];
        ior.value[1] = -ori.value[1];
        ior.value[2] = -ori.value[2];

        this.outs.pushAll();
    }

    tick()
    {
        const { ori, ofs, mat, ior } = this.outs;

        const delta = this.manip.getDeltaPose();
        if (!delta) {
            return;
        }

        ori.value[0] += delta.dPitch * 300 / this.viewportHeight;
        ori.value[1] += delta.dHead * 300 / this.viewportHeight;
        ori.value[2] += delta.dRoll * 300 / this.viewportHeight;

        const factor = ofs.value[2] = Math.max(ofs.value[2], 0.1) * delta.dScale;
        ofs.value[0] -= delta.dX * factor / this.viewportHeight;
        ofs.value[1] += delta.dY * factor / this.viewportHeight;

        _orientation.fromArray(ori.value);
        _orientation.multiplyScalar(math.DEG2RAD);

        _offset.fromArray(ofs.value);

        math.composeOrbitMatrix(_orientation, _offset, _matrix);
        (_matrix as any).toArray(mat.value);

        ior.value[0] = -ori.value[0];
        ior.value[1] = -ori.value[1];
        ior.value[2] = -ori.value[2];

        this.outs.pushAll();
    }

    onPointer(event: IViewportPointerEvent)
    {
        const viewport = event.viewport;

        if (viewport && viewport.useSceneCamera) {
            this.viewportWidth = viewport.width;
            this.viewportHeight = viewport.height;

            return this.manip.onPointer(event);
        }

        return super.onPointer(event);
    }

    onTrigger(event: IViewportTriggerEvent)
    {
        const viewport = event.viewport;

        if (viewport && viewport.useSceneCamera) {
            return this.manip.onTrigger(event);
        }

        return super.onTrigger(event);
    }

    setFromMatrix(matrix: THREE.Matrix4)
    {
        const { ori, ofs } = this.ins;

        if (ori.hasInLinks() || ofs.hasInLinks()) {
            console.warn("OrbitController.setFromMatrix - can't set, inputs are linked");
            return;
        }

        math.decomposeOrbitMatrix(matrix, _orientation, _offset);

        _orientation.multiplyScalar(math.RAD2DEG);
        _orientation.toArray(ori.value);
        _offset.toArray(ofs.value);

        ori.set();
        ofs.set();
    }
}