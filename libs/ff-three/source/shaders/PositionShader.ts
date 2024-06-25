/**
 * FF Typescript Foundation Library
 * Copyright 2020 Ralph Wiedemeier, Frame Factory GmbH
 *
 * License: MIT
 */

import {
    ShaderMaterial,
} from "three";

////////////////////////////////////////////////////////////////////////////////

/**
 * Renders the local position, requires one pass per component (x, y, z).
 */
export default class PositionShader extends ShaderMaterial
{
    isPositionShader = true;

    uniforms = {
        index: { value: 0 },
        range: { value: [ -1, 1 ] }
    };

    vertexShader = [
        "varying vec3 vLocalPosition;",

        "void main() {",
        "  #include <begin_vertex>",
        "  #include <project_vertex>",
        "  vLocalPosition = vec3(position);",
        "}",
    ].join("\n");

    fragmentShader = [
        "uniform float index;",
        "uniform vec2 range;",
        "varying vec3 vLocalPosition;",

        "vec4 toVec4(float v) {",
        "  float vn = (v - range.x) / (range.y - range.x);",
        "  float b0 = floor(vn * 255.0) / 255.0; vn = (vn - b0) * 256.0;",
        "  float b1 = floor(vn * 255.0) / 255.0; vn = (vn - b1) * 256.0;",
        "  float b2 = floor(vn * 255.0) / 255.0; vn = (vn - b2) * 256.0;",
        "  float b3 = floor(vn * 255.0) / 255.0;",
        "  return vec4(clamp(b0, 0.0, 1.0), clamp(b1, 0.0, 1.0), clamp(b2, 0.0, 1.0), clamp(b3, 0.0, 1.0));",
        "}",

        "void main() {",
        "  gl_FragColor = (index == 0.0 ? toVec4(vLocalPosition.x)",
        "    : (index == 1.0 ? toVec4(vLocalPosition.y) : toVec4(vLocalPosition.z)));",
        "}"
    ].join("\n");
}