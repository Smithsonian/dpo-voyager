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

export default class NormalShader extends ShaderMaterial
{
    isNormalShader = true;

    uniforms = {
        index: { value: 0 }
    };

    vertexShader = [
        "  #include <skinning_pars_vertex>",
        "varying vec3 vLocalNormal;",

        "void main() {",
        "  #include <skinbase_vertex>",
        "  #include <beginnormal_vertex>",
        "  #include <skinnormal_vertex>",
        "  #include <begin_vertex>",
        "  #include <skinning_vertex>",
        "  #include <project_vertex>",
        "  vLocalNormal = objectNormal;",
        "}",
    ].join("\n");

    fragmentShader = [
        "uniform vec3 index;",
        "varying vec3 vLocalNormal;",

        "void main() {",
        "  vec3 normal = normalize(vLocalNormal);",
        "  gl_FragColor = vec4(normal * 0.5 + 0.5, 1.0);",
        "}"
    ].join("\n");
}