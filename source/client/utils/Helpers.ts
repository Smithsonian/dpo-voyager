/**
 * 3D Foundation Project
 * Copyright 2024 Smithsonian Institution
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

import { Matrix4, Object3D } from "three";

////////////////////////////////////////////////////////////////////////////////

export function clamp(value: number, min: number, max: number)
{
    return Math.min(Math.max(value, min), max);
}

/** Accumulates transforms from current object to root. */
export function getMeshTransform(root : Object3D, current: Object3D)
{
    var result = new Matrix4();
    var tempMatrix = new Matrix4();

    result.identity();

    do {
        tempMatrix.compose(current.position, current.quaternion, current.scale);
        result.multiply(tempMatrix.invert());

        current = current.parent;
    }
    while (root !== current)

    return result;
}