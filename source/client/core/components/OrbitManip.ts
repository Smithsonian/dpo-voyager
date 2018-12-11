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
import types from "@ff/core/ecs/propertyTypes";

import threeMath from "@ff/three/math";
import UniversalCamera, { ECameraType } from "@ff/three/UniversalCamera";
import OrbitManipController from "@ff/react/OrbitManip";

import Manip, { IViewportPointerEvent, IViewportTriggerEvent } from "./Manip";

////////////////////////////////////////////////////////////////////////////////

export { ECameraType };

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

    ins = this.ins.append({
        proj: types.Enum("View.Projection", ECameraType, ECameraType.Perspective),
        viewPreset: types.Enum("View.Preset", EViewPreset, EViewPreset.None),
        overEnabled: types.Boolean("Override.Enabled", false),
        overPush: types.Event("Override.Push"),
        orient: types.Vector3("Override.Orientation"),
        offset: types.Vector3("Override.Offset", [ 0, 0, 50 ]),
        minOrient: types.Vector3("Min.Orientation", [ -90, -_MAX, -180 ]),
        minOffset: types.Vector3("Min.Offset", [ -_MAX, -_MAX, -_MAX ]),
        maxOrient: types.Vector3("Max.Orientation", [ 90, _MAX, 180 ]),
        maxOffset: types.Vector3("Max.Offset", [ _MAX, _MAX, _MAX ]),
    });

    outs = this.outs.append({
        proj: types.Enum("View.Projection", ECameraType),
        viewPreset: types.Enum("View.Preset", EViewPreset),
        size: types.Number("View.Size"),
        orient: types.Vector3("Orbit.Orientation"),
        invOrient: types.Vector3("Orbit.InverseOrientation"),
        offset: types.Vector3("Orbit.Offset"),
        matrix: types.Matrix4("Orbit.Matrix"),
        manip: types.Event("Orbit.Manip")
    });

    protected manip = new OrbitManipController();

    protected viewportWidth = 100;
    protected viewportHeight = 100;

    protected updateMatrix = false;
    protected onPreset = false;


    update()
    {
        const { ins, outs } = this;

        if (ins.proj.changed) {
            outs.proj.pushValue(ins.proj.value);
        }

        if (ins.viewPreset.changed) {
            outs.viewPreset.pushValue(ins.viewPreset.value);
            outs.orient.value =types.getOptionValue(_orientationPresets, ins.viewPreset.value);
            outs.offset.value[0] = 0;
            outs.offset.value[1] = 0;
            this.onPreset = true;
        }

        if (ins.overPush.changed) {
            outs.orient.value = ins.orient.value.slice();
            outs.offset.value = ins.offset.value.slice();
            this.onPreset = false;
        }

        if (ins.overEnabled.value) {
            if (ins.overEnabled.changed) {
                outs.orient.value = ins.orient.value.slice();
                outs.offset.value = ins.offset.value.slice();
                this.onPreset = false;
            }
            if (ins.orient.changed) {
                outs.orient.value = ins.orient.value;
                this.onPreset = false;
            }
            if (ins.offset.changed) {
                outs.offset.value = ins.offset.value;
                this.onPreset = false;
            }
        }

        this.updateMatrix = true;
    }

    tick()
    {
        const ins = this.ins;
        const { viewPreset, size, orient, offset, matrix, invOrient, manip } = this.outs;

        const delta = this.manip.getDeltaPose();

        if (delta && !this.ins.overEnabled.value) {
            const { minOrient, maxOrient, minOffset, maxOffset } = ins;

            const oriX = orient.value[0] + delta.dPitch * 300 / this.viewportHeight;
            const oriY = orient.value[1] + delta.dHead * 300 / this.viewportHeight;
            const oriZ = orient.value[2] + delta.dRoll * 300 / this.viewportHeight;

            orient.value[0] = coreMath.limit(oriX, minOrient[0], maxOrient[0]);
            orient.value[1] = coreMath.limit(oriY, minOrient[1], maxOrient[1]);
            orient.value[2] = coreMath.limit(oriZ, minOrient[2], maxOrient[2]);

            const ofsZ = Math.max(offset.value[2], 0.1) * delta.dScale;
            const ofsX = offset.value[0] - delta.dX * ofsZ / this.viewportHeight;
            const ofsY = offset.value[1] + delta.dY * ofsZ / this.viewportHeight;

            offset.value[0] = coreMath.limit(ofsX, minOffset[0], maxOffset[0]);
            offset.value[1] = coreMath.limit(ofsY, minOffset[1], maxOffset[1]);
            offset.value[2] = coreMath.limit(ofsZ, minOffset[2], maxOffset[2]);

            manip.push();
            this.updateMatrix = true;
            this.onPreset = false;
        }

        if (this.updateMatrix) {
            this.updateMatrix = false;

            _orientation.fromArray(orient.value).multiplyScalar(coreMath.DEG2RAD);
            _offset.fromArray(offset.value);

            if (types.isEnumEntry(ECameraType.Orthographic, ins.proj.value)) {
                size.pushValue(_offset.z);
                _offset.z = 1000;
            }

            threeMath.composeOrbitMatrix(_orientation, _offset, _matrix);
            (_matrix as any).toArray(matrix.value);

            invOrient.value[0] = -orient.value[0];
            invOrient.value[1] = -orient.value[1];
            invOrient.value[2] = -orient.value[2];

            orient.push();
            invOrient.push();
            offset.push();
            matrix.push();
        }

        if (!this.onPreset && viewPreset.value !== EViewPreset.None) {
            viewPreset.pushValue(EViewPreset.None);
        }
    }

    onPointer(event: IViewportPointerEvent)
    {
        const viewport = event.viewport;

        if (viewport && !viewport.camera) {
            this.viewportWidth = viewport.width;
            this.viewportHeight = viewport.height;

            return this.manip.onPointer(event);
        }

        return super.onPointer(event);
    }

    onTrigger(event: IViewportTriggerEvent)
    {
        const viewport = event.viewport;

        if (viewport && !viewport.camera) {
            return this.manip.onTrigger(event);
        }

        return super.onTrigger(event);
    }

    setFromMatrix(matrix: THREE.Matrix4)
    {
        const { orient, offset, overPush } = this.ins;

        if (orient.hasInLinks() || offset.hasInLinks()) {
            console.warn("OrbitController.setFromMatrix - can't set, inputs are linked");
            return;
        }

        threeMath.decomposeOrbitMatrix(matrix, _orientation, _offset);

        _orientation.multiplyScalar(coreMath.RAD2DEG).toArray(orient.value);
        _offset.toArray(offset.value);

        overPush.set();
    }
}