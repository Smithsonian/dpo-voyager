/**
 * 3D Foundation Project
 * Copyright 2020 Smithsonian Institution
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

import {ShaderMaterial} from "three";

////////////////////////////////////////////////////////////////////////////////

/**
 * Renders the UV coordinates
 * Based on ff-three position shader : Copyright 2020 Ralph Wiedemeier, Frame Factory GmbH
 */
export default class UVShader extends ShaderMaterial
{
    isUVShader = true;

    uniforms = {
        index: { value: 0 }
    };

    vertexShader = [
        "varying vec2 vUv;",

        "void main() {",
        "  #include <beginnormal_vertex>",
        "  #include <begin_vertex>",
        "  #include <project_vertex>",
        "  vUv = uv;",
        "}",
    ].join("\n");

    fragmentShader = [
        "uniform float index;",
        "varying vec2 vUv;",

        "vec4 toVec4(float v) {",
        "  float vn = v;",
        "  float b0 = floor(vn * 255.0) / 255.0; vn = (vn - b0) * 256.0;",
        "  float b1 = floor(vn * 255.0) / 255.0; vn = (vn - b1) * 256.0;",
        "  float b2 = floor(vn * 255.0) / 255.0; vn = (vn - b2) * 256.0;",
        "  float b3 = floor(vn * 255.0) / 255.0;",
        "  return vec4(clamp(b0, 0.0, 1.0), clamp(b1, 0.0, 1.0), clamp(b2, 0.0, 1.0), clamp(b3, 0.0, 1.0));",
        "}",

        "void main() {",
        "  gl_FragColor = index == 0.0 ? toVec4(vUv.x) : toVec4(vUv.y);",
        "}"
    ].join("\n");
}