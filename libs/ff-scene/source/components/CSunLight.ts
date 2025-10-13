/**
* Funded by the Netherlands eScience Center in the context of the
* [Dynamic 3D]{@link https://research-software-directory.org/projects/dynamic3d} project
* and the "Paradata in 3D Scholarship" workshop {@link https://research-software-directory.org/projects/paradata-in-3d-scholarship}
*
* @author c.schnober@esciencecenter.nl
*/

import { Node, types } from "@ff/graph/Component";
import { DirectionalLight } from "three";
import CLight from "./CLight";

export default class CSunLight extends CLight {
    static readonly typeName: string = "CSunLight";

    protected static readonly sunLightIns = {
        position: types.Vector3("Light.Position"),
        target: types.Vector3("Light.Target", [0, -1, 0]),
        shadowSize: types.Number("Shadow.Size", {
            preset: 100,
            min: 0,
        }),
        date: types.String("Light.Date", { preset: "2024-06-21" }),
        time: types.String("Light.Time", { preset: "12:00" }),
        location: types.Vector2("Light.Location", { preset: [52.356424, 4.956953] }),
    };

    ins = this.addInputs<CLight, typeof CSunLight["sunLightIns"]>(CSunLight.sunLightIns);


    constructor(node: Node, id: string) {
        super(node, id);

        this.object3D = new DirectionalLight();
        this.light.target.matrixAutoUpdate = false;
    }
    
    get light(): DirectionalLight {
        return this.object3D as DirectionalLight;
    }
}