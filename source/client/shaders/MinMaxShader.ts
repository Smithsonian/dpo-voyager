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
export default class MinMaxShader extends ShaderMaterial
{
    isUVShader = true;

    uniforms = {
        tDepth: { value: null },
        xOffset: { value: 0 },
        yOffset: { value: 0 },
        xStep: { value: 0 },
        yStep: { value: 0 },
        pass: { value: 0 }
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

        "#include <packing>",

        "varying vec2 vUv;",
        "uniform sampler2D tDepth;",
        "uniform float xOffset;",
        "uniform float yOffset;",
        "uniform float xStep;",
        "uniform float yStep;",
        "uniform int pass;",

        "vec4 toVec4(float v) {",
        "  float vn = v;",
        "  float b0 = floor(vn * 255.0) / 255.0; vn = (vn - b0) * 256.0;",
        "  float b1 = floor(vn * 255.0) / 255.0; vn = (vn - b1) * 256.0;",
        "  float b2 = floor(vn * 255.0) / 255.0; vn = (vn - b2) * 256.0;",
        "  float b3 = floor(vn * 255.0) / 255.0;",
        "  return vec4(clamp(b0, 0.0, 1.0), clamp(b1, 0.0, 1.0), clamp(b2, 0.0, 1.0), clamp(b3, 0.0, 1.0));",
        "}",


        "float readDepth( sampler2D depthSampler, vec2 coord ) {",
            "vec4 c00 = texture2D(depthSampler, coord);",
            "vec4 c10 = texture2D(depthSampler, coord + vec2(xStep, 0));",
            "vec4 c01 = texture2D(depthSampler, coord + vec2(0, yStep));",
            "vec4 c11 = texture2D(depthSampler, coord + vec2(xStep, yStep));",
            "float c00d = c00.w * 255.0 * 2.337437050015319e-10 + c00.z * 255.0 * 5.983838848039216e-8 + c00.y * 255.0 * 1.531862745098039e-5 + c00.x * 255.0 * 0.003921568627451;",
            "float c10d = c10.w * 255.0 * 2.337437050015319e-10 + c10.z * 255.0 * 5.983838848039216e-8 + c10.y * 255.0 * 1.531862745098039e-5 + c10.x * 255.0 * 0.003921568627451;",
            "float c01d = c01.w * 255.0 * 2.337437050015319e-10 + c01.z * 255.0 * 5.983838848039216e-8 + c01.y * 255.0 * 1.531862745098039e-5 + c01.x * 255.0 * 0.003921568627451;",
            "float c11d = c11.w * 255.0 * 2.337437050015319e-10 + c11.z * 255.0 * 5.983838848039216e-8 + c11.y * 255.0 * 1.531862745098039e-5 + c11.x * 255.0 * 0.003921568627451;",
            "return pass == 1 ? max(max(c00d, c10d), max(c01d, c11d)) : ",
            "   min(min(c00d <= 0.0 ? 1.0 : c00d, c10d <= 0.0 ? 1.0 : c10d), min(c01d <= 0.0 ? 1.0 : c01d, c11d <= 0.0 ? 1.0 : c11d));",
        "}",

        "void main() {",
        "    float depth = readDepth( tDepth, vec2((floor(vUv.x/xOffset) * 2.0 + 0.5) * xStep, (floor(vUv.y/yOffset) * 2.0 + 0.5) * yStep) );",
        "    gl_FragColor = toVec4(depth);",
        "}"
    ].join("\n");
}