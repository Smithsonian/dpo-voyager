/**
 * FF Typescript Foundation Library
 * Copyright 2019 Ralph Wiedemeier, Frame Factory GmbH
 *
 * License: MIT
 */

import { MeshPhongMaterial } from "three";

import { Node, types } from "@ff/graph/Component";

import CMaterial from "./CMaterial";
import CTexture from "./CTexture";

////////////////////////////////////////////////////////////////////////////////

export default class CPhongMaterial extends CMaterial
{
    static readonly typeName: string = "CPhongMaterial";

    protected static readonly ins = {
        color: types.ColorRGB("Phong.Color"),
        opacity: types.Percent("Phong.Opacity", 1),
        colorMap: types.Object("Maps.Color", CTexture),
        alphaMap: types.Object("Maps.Alpha", CTexture),
        occlusionMap: types.Object("Maps.Occlusion", CTexture),
        bumpMap: types.Object("Maps.Bump", CTexture),
        displacementMap: types.Object("Maps.Displacement", CTexture),
        emissiveMap: types.Object("Maps.Emissive", CTexture),
        envMap: types.Object("Maps.Environment", CTexture),
        normalMap: types.Object("Maps.Normal", CTexture)
    };

    ins = this.addInputs<CMaterial, typeof CPhongMaterial.ins>(CPhongMaterial.ins, 0);

    constructor(node: Node, id: string)
    {
        super(node, id);
        this._material = new MeshPhongMaterial();
    }

    get material() {
        return this._material as MeshPhongMaterial;
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
        if (ins.colorMap.changed) {
            material.map = ins.colorMap.value && ins.colorMap.value.outs.isReady.value ? ins.colorMap.value.texture : undefined;
        }

        return true;
    }
}