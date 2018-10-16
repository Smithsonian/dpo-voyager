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

import Manip, { IViewportPointerEvent, IViewportTriggerEvent } from "./Manip";
import Hierarchy from "@ff/core/ecs/Hierarchy";

////////////////////////////////////////////////////////////////////////////////

export default class PoseManip extends Manip
{
    static readonly type: string = "PoseManip";

    outs = this.makeProps({
        mat: types.Matrix4("Matrix")
    });

    protected matrix = new THREE.Matrix4();

    protected viewportWidth: number = 100;
    protected viewportHeight: number = 100;

    update()
    {
    }

    tick()
    {

    }

    onPointer(event: IViewportPointerEvent)
    {

    }

    onTrigger(event: IViewportTriggerEvent)
    {
        return super.onTrigger(event);
    }

    setFromMatrix(matrix: THREE.Matrix4)
    {
        this.matrix.copy(matrix);
    }
}