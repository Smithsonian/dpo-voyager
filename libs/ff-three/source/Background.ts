/**
 * FF Typescript Foundation Library
 * Copyright 2020 Ralph Wiedemeier, Frame Factory GmbH
 *
 * License: MIT
 */

import {
    Mesh,
    BufferGeometry,
    InterleavedBuffer,
    InterleavedBufferAttribute,
    RawShaderMaterial,
    Vector3,
    Color,
} from "three";

////////////////////////////////////////////////////////////////////////////////

export enum EBackgroundStyle { Solid, LinearGradient, RadialGradient }

export default class Background extends Mesh
{
    geometry: BackgroundGeometry;
    material: BackgroundMaterial;

    constructor()
    {
        super(new BackgroundGeometry(), new BackgroundMaterial());

        this.frustumCulled = false;
        this.renderOrder = -Infinity;
        this.matrixAutoUpdate = false;
    }

    dispose()
    {
        this.geometry.dispose();
        this.material.dispose();
    }

    updateMatrixWorld(force: boolean)
    {
    }
}

export class BackgroundGeometry extends BufferGeometry
{
    constructor()
    {
        super();

        const vertices = new Float32Array([
            -1, -1, 0, 0, 0,
            1, -1, 0, 1, 0,
            1, 1, 0, 1, 1,
            -1, 1, 0, 0, 1
        ]);

        const buffer = new InterleavedBuffer(vertices, 5);

        this.setIndex([ 0, 1, 2, 0, 2, 3 ]);
        this.setAttribute('position', new InterleavedBufferAttribute(buffer, 3, 0, false));
        this.setAttribute('uv', new InterleavedBufferAttribute(buffer, 2, 3, false));
    }
}

export class BackgroundMaterial extends RawShaderMaterial
{
    set style(style: EBackgroundStyle) {
        this.uniforms.style.value = style;
    }
    get style() {
        return this.uniforms.style.value;
    }

    set color0(color: Vector3 | Color)
    {
        if (color instanceof Color) {
            const value = this.uniforms.color0.value;
            value.x = color.r;
            value.y = color.g;
            value.z = color.b;
        }
        else {
            this.uniforms.color0.value.copy(color);
        }
    }
    get color0() {
        return this.uniforms.color0.value;
    }

    set color1(color: Vector3 | Color)
    {
        if (color instanceof Color) {
            const value = this.uniforms.color1.value;
            value.x = color.r;
            value.y = color.g;
            value.z = color.b;
        }
        else {
            this.uniforms.color1.value.copy(color);
        }
    }
    get color1() {
        return this.uniforms.color1.value;
    }

    set noise(noise: number) {
        this.uniforms.noise.value = noise;
    }
    get noise() {
        return this.uniforms.noise.value;
    }

    depthTest = false;
    depthWrite = false;
    transparent = false;

    uniforms = {
        style: { value: EBackgroundStyle.LinearGradient },
        color0: { value: new Vector3(0.15, 0.2, 0.25) },
        color1: { value: new Vector3(0, 0, 0) },
        noise: { value: 0.02 }
    };

    vertexShader = [
        "precision highp float;",
        "attribute vec3 position;",
        "attribute vec2 uv;",
        "varying vec2 ndc;",

        "void main() {",
        "  ndc = position.xy;",
        "  gl_Position = vec4(position, 1.0);",
        "}",
    ].join("\n");

    // NOTE: Source of random function:
    // http://byteblacksmith.com/improvements-to-the-canonical-one-liner-glsl-rand-for-opengl-es-2-0/

    fragmentShader = [
        "precision highp float;",
        "uniform vec3 color0;",
        "uniform vec3 color1;",
        "uniform float noise;",
        "uniform int style;",
        "varying vec2 ndc;",

        "float rand(vec2 co) {",
            "float dt = dot(co.xy ,vec2(12.9898, 78.233));",
            "float sn = mod(dt, 3.14);",
            "return fract(sin(sn) * 43758.5453);",
        "}",

        "void main() {",
        "  float f = style == 0 ? 0.0 : (style == 1 ? ndc.y * 0.5 + 0.5 : length(ndc) * 0.707);",
        "  gl_FragColor = vec4(mix(color0, color1, f) + noise * rand(ndc), 1.0);",
        "}"
    ].join("\n");
}