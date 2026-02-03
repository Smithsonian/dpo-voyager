/**
* Funded by the Netherlands eScience Center in the context of the
* [Dynamic 3D]{@link https://research-software-directory.org/projects/dynamic3d} project
* and the "Paradata in 3D Scholarship" workshop {@link https://research-software-directory.org/projects/paradata-in-3d-scholarship}
*
* @author Carsten Schnober <c.schnober@esciencecenter.nl>
*/

import { IUpdateContext, Node, types } from "@ff/graph/Component";
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
            preset: new Date("2026-02-01T12:00Z")
        }),
        latitude: types.Number("Light.Latitude", { preset: 52.3676, min: -90, max: 90, step: 0.01 }),
        longitude: types.Number("Light.Longitude", { preset: 4.9041, min: -180, max: 180, step: 0.01 }),
        intensityFactor: types.Number("Light.IntensityFactor", { preset: 5, min: 0 }),
        sunDistance: types.Number("Light.SunDistance", { preset: 500 }),
    };

    ins = this.addInputs<CLight, typeof CSunLight["sunLightIns"]>(CSunLight.sunLightIns);


    constructor(node: Node, id: string) {
        super(node, id);

        const sunlight = new DirectionalLight();

        this.ins.intensity.setValue(2);
        this.object3D = sunlight;
        this.light.target.matrixAutoUpdate = false;

        this.ins.intensity.schema.disabled = true;
        this.ins.color.schema.disabled = true;
    }

    get light(): DirectionalLight {
        return this.object3D as DirectionalLight;
    }

    protected calculateColor(degrees: number): [number, number, number] {
        let r: number, g: number, b: number;

        if (degrees < 0) {
            // deep orange to red (twilight/night)
            const factor = Math.max(0, 1 + degrees / 10);
            r = 1.0;
            g = 0.3 + 0.3 * factor;
            b = 0.1 * factor;
        } else if (degrees < 10) {
            // orange to yellow (sunrise/sunset)
            const factor = degrees / 10;
            r = 1.0;
            g = 0.6 + 0.3 * factor;
            b = 0.2 + 0.3 * factor;
        } else if (degrees < 30) {
            // warm white
            const factor = (degrees - 10) / 20;
            r = 1.0;
            g = 0.9 + 0.1 * factor;
            b = 0.5 + 0.4 * factor;
        } else {
            // cool white to slightly blue
            const factor = Math.min(1, (degrees - 30) / 30);
            r = 1.0 - 0.05 * factor;
            g = 1.0 - 0.02 * factor;
            b = 0.9 + 0.1 * factor;
        }

        return [r, g, b];
    }

    protected calculateIntensity(degrees: number): number {
        let intensity: number;

        if (degrees < -6) {
            intensity = 0;
        } else if (degrees < 0) {
            const factor = (degrees + 6) / 6;
            intensity = 0.3 * factor;
        } else if (degrees < 10) {
            const factor = degrees / 10;
            intensity = 0.3 + 0.7 * factor;
        } else if (degrees < 30) {
            const factor = (degrees - 10) / 20;
            intensity = 1.0 + 1.0 * factor;
        } else {
            const factor = Math.min(1, (degrees - 30) / 60);
            intensity = 2.0 + 0.5 * factor;
        }
        return intensity * this.ins.intensityFactor.value;
    }

    protected calculatePosition(altitude: number, azimuth: number): [number, number, number] {
        // See https://stackoverflow.com/a/71968928/1897839
        const x = this.ins.sunDistance.value * Math.cos(altitude) * Math.sin(azimuth);
        const y = this.ins.sunDistance.value * Math.cos(altitude) * Math.cos(azimuth);
        const z = this.ins.sunDistance.value * Math.sin(altitude);

        return [x, y, z];
    }

    update(context: IUpdateContext) {
        super.update(context);
        const light = this.light;
        const ins = this.ins;

        const sunPosition = SunCalc.getPosition(
            this.ins.datetime.value, this.ins.latitude.value, this.ins.longitude.value
        );
        
        if (ins.shadowSize.changed) {
            const camera = light.shadow.camera;
            const halfSize = ins.shadowSize.value * 0.5;
            camera.left = camera.bottom = -halfSize;
            camera.right = camera.top = halfSize;
            camera.near = 0.05*ins.shadowSize.value;
            camera.far = 50*ins.shadowSize.value;
            camera.updateProjectionMatrix();
        }

        const sunDegrees = sunPosition.altitude * (180 / Math.PI);

        const sunColor = this.calculateColor(sunDegrees);
        ins.color.setValue(sunColor);

        const sunIntensity = this.calculateIntensity(sunDegrees);
        ins.intensity.setValue(sunIntensity);

        if (ins.color.changed || ins.intensity.changed) {
            light.intensity = ins.intensity.value * Math.PI;  //TODO: Remove PI factor here and in CVLightsTask when we can support physically correct lighting units
        }

        const [x, y, z] = this.calculatePosition(sunPosition.altitude, sunPosition.azimuth);
        this.transform.ins.position.setValue([x, y, z]);
        ins.position.setValue([x, y, z]);

        return true;
    }
}