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
import types from "@ff/core/ecs/propertyTypes";
import OrbitManipController from "@ff/react/OrbitManip";

import { ComponentTracker } from "@ff/core/ecs/Component";

import Manip, { IManipPointerEvent, IManipTriggerEvent } from "./Manip";
import TransformComponent from "./Transform";
import RenderContext from "../system/RenderContext";
import { IViewportChangeEvent } from "../three/Viewport";

////////////////////////////////////////////////////////////////////////////////

const _euler = new THREE.Euler();
const _vec4 = new THREE.Vector4();
const _mat4 = new THREE.Matrix4();

export default class OrbitManip extends Manip
{
    static readonly type: string = "OrbitManip";

    ins = this.makeProps({
        orb: types.Vector3("Orbit"),
        ofs: types.Vector3("Offset", [ 0, 0, 50 ])
    });

    outs = this.makeProps({
        orb: types.Vector3("Orbit"),
        ofs: types.Vector3("Offset"),
        mat: types.Matrix4("Matrix"),
        ior: types.Vector3("Inverse.Orbit")
    });

    protected viewportWidth = 100;
    protected viewportHeight = 100;

    protected manip = new OrbitManipController();
    protected transformTracker: ComponentTracker<TransformComponent>;


    create(context: RenderContext)
    {
        super.create(context);

        this.transformTracker = this.trackComponent(TransformComponent, transform => {
            this.outs.linkTo("Matrix", transform.ins, "Matrix");
            this.setFromMatrix(transform.matrix);
        }, transform => {
            this.outs.unlinkTo("Matrix", transform.ins, "Matrix");
        });

        const viewport = context.viewport;
        this.viewportWidth = viewport.width;
        this.viewportHeight = viewport.height;
        viewport.on("change", this.onViewportChange, this);
    }

    update()
    {
        const { orb, ofs, mat, ior } = this.outs;

        orb.value = this.ins.orb.value.slice();
        ofs.value = this.ins.ofs.value.slice();

        this.updateMatrix(orb.value, ofs.value, mat.value);

        ior.value[0] = -orb.value[0];
        ior.value[1] = -orb.value[1];
        ior.value[2] = -orb.value[2];

        this.outs.pushAll();
    }

    tick()
    {
        if (!this.transformTracker.component) {
            return;
        }

        const { orb, ofs, mat, ior } = this.outs;

        const delta = this.manip.getDeltaPose();
        if (!delta) {
            return;
        }

        orb.value[0] += delta.dPitch * 500 / this.viewportWidth;
        orb.value[1] += delta.dHead * 500 / this.viewportWidth;
        const dist = ofs.value[2] = Math.max(ofs.value[2], 0.1) * delta.dScale;
        ofs.value[0] -= delta.dX * dist / this.viewportWidth;
        ofs.value[1] += delta.dY * dist / this.viewportWidth;

        this.updateMatrix(orb.value, ofs.value, mat.value);

        ior.value[0] = -orb.value[0];
        ior.value[1] = -orb.value[1];
        ior.value[2] = -orb.value[2];

        this.outs.pushAll();
    }

    destroy(context: RenderContext)
    {
        context.viewport.off("change", this.onViewportChange, this);
    }

    onPointer(event: IManipPointerEvent)
    {
        const tracker = this.transformTracker;

        if (tracker && tracker.component && this.manip.onPointer(event)) {
            return true;
        }

        return super.onPointer(event);
    }

    onTrigger(event: IManipTriggerEvent)
    {
        const tracker = this.transformTracker;

        if (tracker && tracker.component && this.manip.onTrigger(event)) {
            return true;
        }

        return super.onTrigger(event);
    }

    protected onViewportChange(event: IViewportChangeEvent)
    {
        this.viewportWidth = event.sender.width;
        this.viewportHeight = event.sender.height;
    }

    protected setFromMatrix(matrix: THREE.Matrix4)
    {
        const ins = this.ins;

        if (ins.orb.hasInLinks() || ins.ofs.hasInLinks()) {
            console.warn("OrbitController.setFromMatrix - can't set, inputs are linked");
            return;
        }

        const orbit = ins.orb.value;
        const offset = ins.ofs.value;

        _euler.setFromRotationMatrix(matrix, "YXZ");
        orbit[0] = -_euler.x * math.RAD2DEG;
        orbit[1] = -_euler.y * math.RAD2DEG;
        orbit[2] = -_euler.z * math.RAD2DEG;

        _mat4.getInverse(matrix);
        _vec4.set(0, 0, 0, 1);
        _vec4.applyMatrix4(_mat4);
        offset[0] = -_vec4.x;
        offset[1] = -_vec4.y;
        offset[2] = -_vec4.z;

        ins.orb.setValue(orbit);
        ins.ofs.setValue(offset);
    }

    protected updateMatrix(orbit: number[], offset: number[], result: number[])
    {
        const pitch = -orbit[0] * math.DEG2RAD;
        const head = -orbit[1] * math.DEG2RAD;
        const roll = -orbit[2] * math.DEG2RAD;

        const ox = offset[0];
        const oy = offset[1];
        const oz = offset[2];

        const sinX = Math.sin(pitch);
        const cosX = Math.cos(pitch);
        const sinY = Math.sin(head);
        const cosY = Math.cos(head);
        const sinZ = Math.sin(roll);
        const cosZ = Math.cos(roll);

        const m00 = cosZ * cosY + sinZ * sinX * sinY;
        const m01 = -sinZ * cosY + cosZ * sinX * sinY;
        const m02 = cosX * sinY;
        const m10 = sinZ * cosX;
        const m11 = cosZ * cosX;
        const m12 = -sinX;
        const m20 = -cosZ * sinY + sinZ * sinX * cosY;
        const m21 = sinZ * sinY + cosZ * sinX * cosY;
        const m22 = cosX * cosY;

        result[0] = m00;
        result[1] = m10;
        result[2] = m20;
        result[3] = 0;
        result[4] = m01;
        result[5] = m11;
        result[6] = m21;
        result[7] = 0;
        result[8] = m02;
        result[9] = m12;
        result[10] = m22;
        result[11] = 0;

        result[12] = ox * m00 + oy * m01 + oz * m02;
        result[13] = ox * m10 + oy * m11 + oz * m12;
        result[14] = ox * m20 + oy * m21 + oz * m22;
        result[15] = 1;

        return result;
    }
}