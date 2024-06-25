/**
 * FF Typescript Foundation Library
 * Copyright 2019 Ralph Wiedemeier, Frame Factory GmbH
 *
 * License: MIT
 */

import CObject3D, { Node, types } from "./CObject3D";
import Background, { EBackgroundStyle } from "@ff/three/Background";

////////////////////////////////////////////////////////////////////////////////

export { EBackgroundStyle };

export default class CBackground extends CObject3D
{
    static readonly typeName: string = "CBackground";

    protected static readonly backgroundIns = {
        style: types.Enum("Background.Style", EBackgroundStyle, EBackgroundStyle.RadialGradient),
        color0: types.ColorRGB("Background.Color0", [ 0.2, 0.25, 0.3 ]),
        color1: types.ColorRGB("Background.Color1", [ 0.01, 0.03, 0.05 ]),
        noise: types.Number("Background.Noise", { min: 0, max: 1, bar: true, preset: 0.02 }),
    };

    ins = this.addInputs<CObject3D, typeof CBackground["backgroundIns"]>(CBackground.backgroundIns);

    constructor(node: Node, id: string)
    {
        super(node, id);
        this.object3D = new Background();
    }

    protected get background() {
        return this.object3D as Background;
    }

    update(context)
    {
        super.update(context);

        const ins = this.ins;
        const material = this.background.material;

        if (ins.style.changed) {
            material.style = ins.style.getValidatedValue();
        }
        if (ins.color0.changed) {
            material.color0.fromArray(ins.color0.value);
        }
        if (ins.color1.changed) {
            material.color1.fromArray(ins.color1.value);
        }
        if (ins.noise.changed) {
            material.noise = ins.noise.value;
        }

        return true;
    }

    dispose()
    {
        this.background.dispose();
        super.dispose();
    }
}