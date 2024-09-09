/**
 * FF Typescript Foundation Library
 * Copyright 2020 Ralph Wiedemeier, Frame Factory GmbH
 *
 * License: MIT
 */

import {
    Mesh,
    MeshPhongMaterial,
    MeshPhongMaterialParameters,
    PlaneGeometry,
    MathUtils,
    UniformsUtils,
    ShaderLib,
} from "three";

import { Dictionary } from "@ff/core/types";

const fragmentShader = require("./shaders/floorPhongShader.frag").default;
const vertexShader = require("./shaders/floorPhongShader.vert").default;

////////////////////////////////////////////////////////////////////////////////

export default class Floor extends Mesh
{
    geometry: PlaneGeometry;
    material: FloorMaterial;

    constructor()
    {
        super(
            new PlaneGeometry(2, 2, 1, 1),
            new FloorMaterial()
        );

        this.geometry.rotateX(-90 * MathUtils.DEG2RAD);

        this.receiveShadow = true;
    }

    dispose()
    {
        this.geometry.dispose();
        this.material.dispose();
    }
}

export interface IFloorMaterialParameters extends MeshPhongMaterialParameters
{
}

export class FloorMaterial extends MeshPhongMaterial
{
    readonly isMeshPhongMaterial = true;
    readonly isFloorMaterial = true;

    uniforms: {
    };

    defines: Dictionary<any> = {};

    vertexShader: string;
    fragmentShader: string;

    constructor(params?: IFloorMaterialParameters)
    {
        super(params);

        this.type = "FloorMaterial";

        this.defines = {};
        this.uniforms = UniformsUtils.merge([
            ShaderLib.phong.uniforms
        ]);

        this.vertexShader = vertexShader;
        this.fragmentShader = fragmentShader;

        this.transparent = true;
        this.shininess = 0;
    }
}

