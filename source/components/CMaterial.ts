/**
 * FF Typescript Foundation Library
 * Copyright 2019 Ralph Wiedemeier, Frame Factory GmbH
 *
 * License: MIT
 */

import { Material } from "three";
import * as constants from "three/src/constants";

import Component, { Node, types } from "@ff/graph/Component";

////////////////////////////////////////////////////////////////////////////////

export { Node, types };

export enum EBlending { Off, Normal, Additive, Subtractive, Multiply, Custom }

const _THREE_BLENDING = [
    constants.NoBlending,
    constants.NormalBlending,
    constants.AdditiveBlending,
    constants.SubtractiveBlending,
    constants.MultiplyBlending,
    constants.CustomBlending,
];

export enum EDepthFunction { Never, Always, Less, LessEqual, GreaterEqual, Greater, NotEqual }

const _THREE_DEPTH_FUNCTION = [
    constants.NeverDepth,
    constants.AlwaysDepth,
    constants.LessDepth,
    constants.LessEqualDepth,
    constants.GreaterEqualDepth,
    constants.GreaterDepth,
    constants.NotEqualDepth
];

export enum ESide { Front, Back, Double }

const _THREE_SIDE = [
    constants.FrontSide,
    constants.BackSide,
    constants.DoubleSide,
];

export default class CMaterial extends Component
{
    static readonly typeName: string = "CMaterial";

    protected static readonly matIns = {
        side: types.Enum("Material.Side", ESide, ESide.Front),
        blending: types.Enum("Material.Blending", EBlending, EBlending.Normal),
        transparent: types.Boolean("Material.Transparent"),
        flat: types.Boolean("Material.Flat", false),
        fog: types.Boolean("Material.Fog", true),
        writeColor: types.Boolean("Material.WriteColor", true),
        writeDepth: types.Boolean("Material.WriteDepth", true),
        testDepth: types.Boolean("Material.DepthTest", true),
        depthFunc: types.Enum("Material.DepthFunction", EDepthFunction, EDepthFunction.LessEqual),
    };

    protected static readonly matOuts = {
        self: types.Object("Material", CMaterial),
    };

    ins = this.addInputs(CMaterial.matIns);
    outs = this.addOutputs(CMaterial.matOuts);

    protected _material: Material = null;

    constructor(node: Node, id: string)
    {
        super(node, id);
        this.outs.self.setValue(this);
    }

    get material() {
        return this._material;
    }

    update()
    {
        const material = this._material;
        const ins = this.ins;

        if (!material) {
            return false;
        }

        if (ins.side.changed) {
            material.side = _THREE_SIDE[ins.side.getValidatedValue()];
        }
        if (ins.blending.changed || ins.transparent.changed || ins.flat.changed || ins.fog.changed) {
            material.blending = _THREE_BLENDING[ins.blending.getValidatedValue()];
            material.transparent = ins.transparent.value;
        }
        if (ins.writeColor.changed || ins.writeDepth.changed || ins.testDepth.changed || ins.depthFunc.changed) {
            material.colorWrite = ins.writeColor.value;
            material.depthWrite = ins.writeDepth.value;
            material.depthTest = ins.testDepth.value;
            material.depthFunc = _THREE_DEPTH_FUNCTION[ins.depthFunc.getValidatedValue()];
        }

        return true;
    }

    dispose()
    {
        if (this._material) {
            this._material.dispose();
            this._material = null;
        }

        super.dispose();
    }
}