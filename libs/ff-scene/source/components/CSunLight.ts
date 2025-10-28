/**
* Funded by the Netherlands eScience Center in the context of the
* [Dynamic 3D]{@link https://research-software-directory.org/projects/dynamic3d} project
* and the "Paradata in 3D Scholarship" workshop {@link https://research-software-directory.org/projects/paradata-in-3d-scholarship}
*
* @author c.schnober@esciencecenter.nl
*/

import { IUpdateContext, Node, types } from "@ff/graph/Component";
import { DateTime } from "luxon";
import * as SunCalc from 'suncalc';
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
        datetime: types.DateTime("Light.DateTime", {
            preset: DateTime.now().set({ second: 0, millisecond: 0 })
        }),
        latitude: types.Number("Light.Latitude", { preset: 52.3676, min: -90, max: 90 }),
        longitude: types.Number("Light.Longitude", { preset: 4.9041, min: -180, max: 180 }),
    };

    ins = this.addInputs<CLight, typeof CSunLight["sunLightIns"]>(CSunLight.sunLightIns);


    constructor(node: Node, id: string) {
        super(node, id);

        const sunlight = new DirectionalLight();

        this.ins.intensity.setValue(2);
        this.object3D = sunlight;
        this.light.target.matrixAutoUpdate = false;
    }

    get light(): DirectionalLight {
        return this.object3D as DirectionalLight;
    }

    update(context: IUpdateContext) {
        super.update(context);
        const light = this.light;
        const ins = this.ins;

        if (ins.color.changed || ins.intensity.changed) {
            light.intensity = ins.intensity.value * Math.PI;  //TODO: Remove PI factor here and in CVLightsTask when we can support physically correct lighting units
        }

        const sunPosition = SunCalc.getPosition(
            this.ins.datetime.value, this.ins.latitude.value, this.ins.longitude.value
        );
        const distance = 5000;

        // See https://stackoverflow.com/a/71968928/1897839
        const x = distance * Math.cos(sunPosition.altitude) * Math.sin(sunPosition.azimuth);
        const y = distance * Math.cos(sunPosition.altitude) * Math.cos(sunPosition.azimuth);
        const z = distance * Math.sin(sunPosition.altitude);

        this.transform.ins.position.setValue([x, y, z]);
        ins.position.setValue([x, y, z]);

        return true;
    }
}