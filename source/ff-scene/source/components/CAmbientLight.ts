import { AmbientLight } from "three";

import { Node } from "@ff/graph/Component";

import CLight from "./CLight";

////////////////////////////////////////////////////////////////////////////////


export default class CAmbientLight extends CLight
{
    static readonly typeName: string = "CAmbientLight";

    constructor(node: Node, id: string)
    {
        super(node, id);
        this.object3D = new AmbientLight();
    }

    get light(): AmbientLight {
        return this.object3D as AmbientLight;
    }
}