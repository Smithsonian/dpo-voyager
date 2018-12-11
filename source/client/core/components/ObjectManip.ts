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

import types from "@ff/core/ecs/propertyTypes";
import ObjectManipulator from "@ff/three/ObjectManipulator";

import Manip, { IViewportPointerEvent, IViewportTriggerEvent } from "./Manip";

////////////////////////////////////////////////////////////////////////////////

export enum ETargetType { Camera, Object }
export enum ESizeMode { Dolly, Zoom }

export default class ObjectManip extends Manip
{
    static readonly type: string = "ObjectManip";

    ins = this.ins.append({
        overEnabled: types.Boolean("Override.Enabled", false),
        overPush: types.Event("Override.Push"),
        orient: types.Vector3("Override.Orientation"),
        offset: types.Vector2("Override.Offset", [ 0, 0 ]),
        dist: types.Number("Override.Distance", 50),
        zoom: types.Number("Override.Zoom", 1),
        minOrient: types.Vector3("Min.Orientation", [ -90, NaN, -180 ]),
        minOffset: types.Vector2("Min.Offset", [ NaN, NaN ]),
        minDist: types.Number("Min.Distance", 0.1),
        maxOrient: types.Vector3("Max.Orientation", [ 90, NaN, 180 ]),
        maxOffset: types.Vector2("Max.Offset", [ NaN, NaN ]),
        maxDist: types.Number("Max.Distance", 100),
    });

    outs = this.outs.append({
        orient: types.Vector3("Orientation"),
        offset: types.Vector2("Offset"),
        dist: types.Number("Distance"),
        zoom: types.Number("Zoom"),
        matrix: types.Matrix4("Matrix")
    });

    protected manip = new ObjectManipulator();
    protected updateMatrix = false;

    update()
    {
        const { ins, manip } = this;

        if (ins.overPush.changed || (ins.overEnabled.changed && ins.overEnabled.value)) {
            manip.orientation.fromArray(ins.orient.value);
            manip.offset.fromArray(ins.offset.value);
            manip.distance = ins.dist.value;
            manip.zoom = ins.zoom.value;
        }

        if (ins.overEnabled) {
            if (ins.orient.changed) {
                manip.orientation.fromArray(ins.orient.value);
            }
            if (ins.offset.changed) {
                manip.offset.fromArray(ins.offset.value);
            }
            if (ins.dist.changed) {
                manip.distance = ins.dist.value;
            }
            if (ins.zoom.changed) {
                manip.zoom = ins.zoom.value;
            }
        }

        this.updateMatrix = true;
    }

    tick()
    {
        const { ins, outs } = this;

        this.manip.update();
    }

    onPointer(event: IViewportPointerEvent)
    {
        if (event.viewport && !event.viewport.camera && this.manip.onPointer(event)) {
            return true;
        }

        return super.onPointer(event);
    }

    onTrigger(event: IViewportTriggerEvent)
    {
        if (event.viewport && !event.viewport.camera && this.manip.onTrigger(event)) {
            return true;
        }

        return super.onTrigger(event);
    }
}