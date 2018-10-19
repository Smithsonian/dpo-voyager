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

import coreMath from "@ff/core/math";
import threeMath from "@ff/three/math";
import types from "@ff/core/ecs/propertyTypes";
import OrbitManipController from "@ff/react/OrbitManip";

import Manip, { IViewportPointerEvent, IViewportTriggerEvent } from "./Manip";
import { EProjectionType } from "./Camera";

////////////////////////////////////////////////////////////////////////////////

export { EProjectionType };

export enum EViewPreset { Left, Right, Top, Bottom, Front, Back, None }

const _orientationPresets = [
    [ 0, 90, 0 ], // left
    [ 0, -90, 0 ], // right
    [ 90, 0, 0 ], // top
    [ -90, 0, 0 ], // bottom
    [ 0, 0, 0 ], // front
    [ 0, 180, 0 ] // back
];

const _MAX = Number.MAX_VALUE;
const _orientation = new THREE.Vector3();
const _offset = new THREE.Vector3();
const _matrix = new THREE.Matrix4();

export default class OrbitManip extends Manip
{
    static readonly type: string = "OrbitManip";

    ins = this.makeProps({
        pro: types.Enum("View.Projection", EProjectionType),
        pre: types.Enum("View.Preset", EViewPreset),
        ena: types.Boolean("Override.Enabled", false),
        pus: types.Event("Override.Push"),
        ori: types.Vector3("Override.Orientation"),
        ofs: types.Vector3("Override.Offset", [ 0, 0, 50 ]),
        minOri: types.Vector3("Min.Orientation", [ -90, -_MAX, -180 ]),
        minOfs: types.Vector3("Min.Offset", [ -_MAX, -_MAX, -_MAX ]),
        maxOri: types.Vector3("Max.Orientation", [ 90, _MAX, 180 ]),
        maxOfs: types.Vector3("Max.Offset", [ _MAX, _MAX, _MAX ]),
    });

    outs = this.makeProps({
        pro: types.Enum("View.Projection", EProjectionType),
        siz: types.Number("View.Size"),
        ori: types.Vector3("Orbit.Orientation"),
        ior: types.Vector3("Orbit.InverseOrientation"),
        ofs: types.Vector3("Orbit.Offset"),
        mat: types.Matrix4("Orbit.Matrix"),
        man: types.Event("Orbit.Manip")
    });

    protected manip = new OrbitManipController();

    protected viewportWidth = 100;
    protected viewportHeight = 100;

    protected updateMatrix = false;


    update()
    {
        const ins = this.ins;
        const outs = this.outs;

        if (ins.pro.changed) {
            outs.pro.pushValue(ins.pro.value);
        }

        if (ins.pre.changed) {
            outs.ori.value = types.getOptionValue(_orientationPresets, ins.pre.value);
            outs.ofs.value[0] = 0;
            outs.ofs.value[1] = 0;
        }

        if (ins.pus.changed) {
            outs.ori.value = ins.ori.value.slice();
            outs.ofs.value = ins.ofs.value.slice();
        }

        if (ins.ena.value) {
            if (ins.ena.changed) {
                outs.ori.value = ins.ori.value.slice();
                outs.ofs.value = ins.ofs.value.slice();
            }
            if (ins.ori.changed) {
                outs.ori.value = ins.ori.value;
            }
            if (ins.ofs.changed) {
                outs.ofs.value = ins.ofs.value;
            }
        }

        this.updateMatrix = true;
    }

    tick()
    {
        const ins = this.ins;
        const { siz, ori, ofs, mat, ior, man } = this.outs;

        const delta = this.manip.getDeltaPose();

        if (delta && !this.ins.ena.value) {
            const { minOri, maxOri, minOfs, maxOfs } = ins;

            const oriX = ori.value[0] + delta.dPitch * 300 / this.viewportHeight;
            const oriY = ori.value[1] + delta.dHead * 300 / this.viewportHeight;
            const oriZ = ori.value[2] + delta.dRoll * 300 / this.viewportHeight;

            ori.value[0] = coreMath.limit(oriX, minOri[0], maxOri[0]);
            ori.value[1] = coreMath.limit(oriY, minOri[1], maxOri[1]);
            ori.value[2] = coreMath.limit(oriZ, minOri[2], maxOri[2]);

            const ofsZ = Math.max(ofs.value[2], 0.1) * delta.dScale;
            const ofsX = ofs.value[0] - delta.dX * ofsZ / this.viewportHeight;
            const ofsY = ofs.value[1] + delta.dY * ofsZ / this.viewportHeight;

            ofs.value[0] = coreMath.limit(ofsX, minOfs[0], maxOfs[0]);
            ofs.value[1] = coreMath.limit(ofsY, minOfs[1], maxOfs[1]);
            ofs.value[2] = coreMath.limit(ofsZ, minOfs[2], maxOfs[2]);

            man.push();
            this.updateMatrix = true;
        }

        if (this.updateMatrix) {
            this.updateMatrix = false;

            _orientation.fromArray(ori.value);
            _orientation.multiplyScalar(coreMath.DEG2RAD);

            _offset.fromArray(ofs.value);

            if (types.isEnumEntry(EProjectionType.Orthographic, ins.pro.value)) {
                siz.pushValue(_offset.z);
                _offset.z = 1000;
            }

            threeMath.composeOrbitMatrix(_orientation, _offset, _matrix);
            (_matrix as any).toArray(mat.value);

            ior.value[0] = -ori.value[0];
            ior.value[1] = -ori.value[1];
            ior.value[2] = -ori.value[2];

            ori.push();
            ior.push();
            ofs.push();
            mat.push();
        }
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
        const { ori, ofs, pus } = this.ins;

        if (ori.hasInLinks() || ofs.hasInLinks()) {
            console.warn("OrbitController.setFromMatrix - can't set, inputs are linked");
            return;
        }

        threeMath.decomposeOrbitMatrix(matrix, _orientation, _offset);

        _orientation.multiplyScalar(coreMath.RAD2DEG);
        _orientation.toArray(ori.value);
        _offset.toArray(ofs.value);

        pus.set();
    }
}