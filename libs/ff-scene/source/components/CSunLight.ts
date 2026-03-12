/**
* Funded by the Netherlands eScience Center in the context of the
* [Dynamic 3D]{@link https://research-software-directory.org/projects/dynamic3d} project
* and the "Paradata in 3D Scholarship" workshop {@link https://research-software-directory.org/projects/paradata-in-3d-scholarship}
*
* @author Carsten Schnober <c.schnober@esciencecenter.nl>
*/

import { IUpdateContext, Node, types } from "@ff/graph/Component";
import Notification from "@ff/ui/Notification";
import * as dayjs from "dayjs";
import * as timezone from "dayjs/plugin/timezone";
import * as utc from "dayjs/plugin/utc";
import * as SunCalc from 'suncalc';
import { DirectionalLight } from "three";
import CLight from "./CLight";
//var tzlookup = require("@photostructure/tz-lookup");

type TDayjsFactory = (date?: dayjs.ConfigType) => dayjs.Dayjs;
const utcPlugin = (utc as unknown as { default?: dayjs.PluginFunc<unknown> }).default || utc as unknown as dayjs.PluginFunc<unknown>;
const timezonePlugin = (timezone as unknown as { default?: dayjs.PluginFunc<unknown> }).default || timezone as unknown as dayjs.PluginFunc<unknown>;
const createDayjs = ((dayjs as unknown as { default?: TDayjsFactory }).default || dayjs as unknown as TDayjsFactory);

dayjs.extend(utcPlugin);
dayjs.extend(timezonePlugin);

export default class CSunLight extends CLight {
    static readonly typeName: string = "CSunLight";

    protected previousTimezone: string = "UTC";

    protected static readonly sunLightIns = {
        position: types.Vector3("Light.Position"),
        target: types.Vector3("Light.Target", [0, -1, 0]),
        shadowSize: types.Number("Shadow.Size", {
            preset: 100,
            min: 0,
        }),
        datetime: types.DateTime("Light.DateTime", {
            preset: createDayjs()
        }),
        timezone: types.String("Light.TimeZone", {
            preset: dayjs.tz.guess()
        }),
        latitude: types.Number("Light.Latitude", { preset: 52.3676, min: -90, max: 90, step: 0.01 }),
        longitude: types.Number("Light.Longitude", { preset: 4.9041, min: -180, max: 180, step: 0.01 }),
        intensityFactor: types.Number("Light.IntensityFactor", { preset: 5, min: 0 }),
    };

    ins = this.addInputs<CLight, typeof CSunLight["sunLightIns"]>(CSunLight.sunLightIns);


    constructor(node: Node, id: string) {
        super(node, id);

        const sunlight = new DirectionalLight();

        this.ins.intensity.setValue(2);
        this.object3D = sunlight;
        this.light.target.matrixAutoUpdate = false;
        this.previousTimezone = (this.ins.timezone.value || "UTC").trim() || "UTC";
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
        const x = Math.cos(altitude) * Math.sin(azimuth);
        const y = Math.cos(altitude) * Math.cos(azimuth);
        const z = Math.sin(altitude);

        return [x, y, z];
    }

    get nonEditableProperties(): string[] {
        return ["Light.Intensity", "Light.Color"];
    }

    protected sunDate(): Date {
        const dateTime = this.ins.datetime.value;
        const zone = (this.ins.timezone.value || "").trim();
        const fallbackPreset = this.ins.datetime.schema.preset;
        const fallbackDateTime = dateTime?.isValid() ? dateTime.toDate()
            : (fallbackPreset?.isValid() ? fallbackPreset.toDate() : new Date());

        const resetTimezoneToPrevious = () => {
            if (this.ins.timezone.value !== this.previousTimezone) {
                this.ins.timezone.setValue(this.previousTimezone, true);
            }
        };

        if (!dateTime?.isValid() || !zone) {
            Notification.show(`Invalid date/time or timezone. Reverting to previous valid date/time and timezone.`, "error");
            resetTimezoneToPrevious();
            return fallbackDateTime;
        }

        try {
            const wallClock = dateTime.format("YYYY-MM-DDTHH:mm:ss");
            const zonedDateTime = dayjs.tz(wallClock, zone);

            if (!zonedDateTime.isValid()) {
                resetTimezoneToPrevious();
                return fallbackDateTime;
            }

            this.previousTimezone = zone;
            return zonedDateTime.toDate();
        }
        catch (e) {
            Notification.show(`Invalid timezone: '${zone}'. Reverting to previous timezone '${this.previousTimezone}'`, "error");
            resetTimezoneToPrevious();
            return fallbackDateTime;
        }
    }

    update(context: IUpdateContext) {
        super.update(context);
        const light = this.light;
        const ins = this.ins;

        if (ins.datetime.changed || ins.timezone.changed || ins.latitude.changed || ins.longitude.changed || ins.intensityFactor.changed) {

            /*if (ins.latitude.changed || ins.longitude.changed) {
                ins.timezone.setValue(tzlookup(this.ins.latitude.value, this.ins.longitude.value), true);
            }*/

            const sunPosition = SunCalc.getPosition(
                this.sunDate(), this.ins.latitude.value, this.ins.longitude.value
            );

            const [x, y, z] = this.calculatePosition(sunPosition.altitude, sunPosition.azimuth);
            this.transform.ins.position.setValue([x, y, z]);

            const sunDegrees = sunPosition.altitude * (180 / Math.PI);

            const sunColor = this.calculateColor(sunDegrees);
            ins.color.setValue(sunColor);

            const sunIntensity = this.calculateIntensity(sunDegrees);
            ins.intensity.setValue(sunIntensity);
        }

        if (ins.shadowSize.changed) {
            const camera = light.shadow.camera;
            const halfSize = ins.shadowSize.value * 0.5;
            camera.left = camera.bottom = -halfSize;
            camera.right = camera.top = halfSize;
            camera.near = 0.05*ins.shadowSize.value;
            camera.far = 50*ins.shadowSize.value;
            camera.updateProjectionMatrix();
        }

        if (ins.color.changed || ins.intensity.changed) {
            light.color.fromArray(ins.color.value);
            light.intensity = ins.intensity.value * Math.PI;  //TODO: Remove PI factor here and in CVLightsTask when we can support physically correct lighting units
        }

        return true;
    }
}