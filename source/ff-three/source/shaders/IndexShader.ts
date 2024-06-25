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

export default class IndexShader extends ShaderMaterial
{
    static indexFromPixel(pixel: Uint8Array)
    {
        return pixel[0] + pixel[1] << 8 + pixel[2] << 16;
    }

    static zoneFromPixel(pixel: Uint8Array)
    {
        return pixel[3];
    }

    isIndexShader = true;
    uniformsNeedUpdate = false;

    lights = false;

    setIndex(index: number)
    {
        const hb = index >> 16;
        const mb = (index >> 8) - (hb << 8);
        const lb = index - (hb << 16) - (mb << 8);

        const value = this.uniforms.index.value;
        value[0] = lb / 255;
        value[1] = mb / 255;
        value[2] = hb / 255;

        this.uniformsNeedUpdate = true;
    }

    uniforms = {
        index: { value: [ 0, 0, 0 ] }
    };

    vertexShader = [
        "void main() {",
        "  #include <begin_vertex>",
        "  #include <project_vertex>",
        "}",
    ].join("\n");

    fragmentShader = [
        "uniform vec3 index;",

        "void main() {",
        "  gl_FragColor = vec4(index, 1.0);",
        "}"
    ].join("\n");
}