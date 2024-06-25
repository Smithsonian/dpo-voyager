/**
 * FF Typescript Foundation Library
 * Copyright 2019 Ralph Wiedemeier, Frame Factory GmbH
 *
 * License: MIT
 */

import { MeshStandardMaterial } from "three";

import CMaterial, { Node, types } from "./CMaterial";

////////////////////////////////////////////////////////////////////////////////

export default class CStandardMaterial extends CMaterial
{
    static readonly typeName: string = "CStandardMaterial";

    protected static readonly ins = {
        color: types.ColorRGB("Standard.Color"),
        opacity: types.Percent("Standard.Opacity", 1),
    };

    ins = this.addInputs<CMaterial, typeof CStandardMaterial.ins>(CStandardMaterial.ins, 0);

    constructor(node: Node, id: string)
    {
        super(node, id);
        this._material = new MeshStandardMaterial();
    }

    get material() {
        return this._material as MeshStandardMaterial;
    }

    update()
    {
        super.update();

        const material = this.material;
        const ins = this.ins;

        if (ins.color.changed || ins.opacity.changed) {
            const rgb  = ins.color.value;
            material.color.setRGB(rgb[0], rgb[1], rgb[2]);
            material.opacity = ins.opacity.value;
        }

        return true;
    }
}