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

////////////////////////////////////////////////////////////////////////////////

export function Matrix4_isIdentity(mat: THREE.Matrix4)
{
    const e = mat.elements;
    return e[0]  === 1 && e[1]  === 0 && e[2]  === 0 && e[3]  === 0
        && e[4]  === 0 && e[5]  === 1 && e[6]  === 0 && e[7]  === 0
        && e[8]  === 0 && e[9]  === 0 && e[10] === 1 && e[11] === 0
        && e[12] === 0 && e[13] === 0 && e[14] === 0 && e[15] === 1;
}