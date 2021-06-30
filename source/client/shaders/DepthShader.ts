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
        tDepth: { value: null },
        cameraNear: { value: 0 },
        cameraFar: { value: 0}
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
        /*"#include <packing>",

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
        "float near=0.1; float far = 2000.0;",
        "float z = gl_FragCoord.z;",  // depth value [0,1]
        "float ndcZ = 2.0*z - 1.0;",  // [-1,1]
        "float linearDepth = (2.0 * near * far) / (far + near - ndcZ * (far - near));",
        "  gl_FragColor = toVec4(linearDepth);",
        "}"*/

        "#include <packing>",

        "varying vec2 vUv;",
        "uniform sampler2D tDepth;",
        "uniform float cameraNear;",
        "uniform float cameraFar;",

        "vec4 toVec4(float v) {",
        "  float vn = v;",
        "  float b0 = floor(vn * 255.0) / 255.0; vn = (vn - b0) * 256.0;",
        "  float b1 = floor(vn * 255.0) / 255.0; vn = (vn - b1) * 256.0;",
        "  float b2 = floor(vn * 255.0) / 255.0; vn = (vn - b2) * 256.0;",
        "  float b3 = floor(vn * 255.0) / 255.0;",
        "  return vec4(clamp(b0, 0.0, 1.0), clamp(b1, 0.0, 1.0), clamp(b2, 0.0, 1.0), clamp(b3, 0.0, 1.0));",
        "}",


        "float readDepth( sampler2D depthSampler, vec2 coord ) {",
        "    float fragCoordZ = gl_FragCoord.z;", //texture2D( depthSampler, coord ).x;",
        "    float viewZ = perspectiveDepthToViewZ( fragCoordZ, cameraNear, cameraFar );",
        "    return viewZToOrthographicDepth( viewZ, cameraNear, cameraFar );",
        "}",

        "void main() {",
        "    float depth = readDepth( tDepth, vUv );",

        //"    gl_FragColor.rgb = 1.0 - vec3( depth*100.0f );",
        //"    gl_FragColor.rgb = vec3( 1.0, 0.0, 0.0 );",
        //"    gl_FragColor.a = 1.0;",
        "    gl_FragColor = toVec4(depth);",
        "}"
    ].join("\n");
}