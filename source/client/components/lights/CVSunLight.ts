/**
* Funded by the Netherlands eScience Center in the context of the
* [Dynamic 3D]{@link https://research-software-directory.org/projects/dynamic3d} project
* and the "Paradata in 3D Scholarship" workshop {@link https://research-software-directory.org/projects/paradata-in-3d-scholarship}
*
* @author Carsten Schnober <c.schnober@esciencecenter.nl>
*/

import { EShadowMapResolution } from "@ff/scene/components/CLight";
import CSunLight from "@ff/scene/components/CSunLight";
import { DateTime } from "luxon";
import { ColorRGB, IDocument, ILight, INode, TLightType } from "../../schema/document";
import { ICVLight } from "./CVLight";

export default class CVSunLight extends CSunLight implements ICVLight {
    static readonly typeName: string = "CVSunLight";
    static readonly type: TLightType = "sun";
    static readonly text: string = "Sun";
    static readonly icon: string = "sun";

    public static readonly AUTO_PROPERTIES = ["Light.Intensity", "Light.Color"];

    get settingProperties() {
        return [
            this.ins.enabled,
            this.ins.color,
            this.ins.intensity,
            this.ins.datetime,
            this.ins.latitude,
            this.ins.longitude,
            this.ins.intensityFactor,
            this.ins.sunDistance,
            // shadow properties
            this.ins.shadowEnabled,
            this.ins.shadowSize,
            this.ins.shadowResolution,
            this.ins.shadowBlur,
            this.ins.shadowIntensity,
        ];
    }

    get snapshotProperties() {
        return [
            this.ins.color,
            this.ins.intensity,
            this.ins.datetime,
            this.ins.latitude,
            this.ins.longitude,
            this.ins.intensityFactor,
            this.ins.sunDistance,
        ];
    }

    dispose(): void {
        if (this.ins.shadowEnabled.value && this.light.shadow.map) {
            this.light.shadow.map.dispose();
        }

        super.dispose()
    }

    fromDocument(document: IDocument, node: INode): number {
        if (!isFinite(node.light)) {
            throw new Error("light property missing in node");
        }

        const data = document.lights[node.light];
        const ins = this.ins;

        if (data.type !== "sun") {
            throw new Error("light type mismatch: not a sun light");
        }

        ins.name.setValue(node.name);

        ins.copyValues({
            enabled: data.enabled !== undefined ? data.enabled : ins.enabled.schema.preset,
            color: data.color !== undefined ? data.color : ins.color.schema.preset,
            intensity: data.intensity !== undefined ? data.intensity : ins.intensity.schema.preset,
            datetime: data.sun?.datetime !== undefined ? DateTime.fromISO(data.sun.datetime) : ins.datetime.schema.preset,
            latitude: data.sun?.latitude !== undefined ? data.sun.latitude : ins.latitude.schema.preset,
            longitude: data.sun?.longitude !== undefined ? data.sun.longitude : ins.longitude.schema.preset,
            intensityFactor: data.sun?.intensityFactor !== undefined ? data.sun.intensityFactor : ins.intensityFactor.schema.preset,

            position: ins.position.schema.preset,
            target: ins.target.schema.preset,

            shadowEnabled: data.shadowEnabled || false,
            shadowSize: data.shadowSize !== undefined ? data.shadowSize : ins.shadowSize.schema.preset,
            shadowResolution: data.shadowResolution !== undefined ? EShadowMapResolution[data.shadowResolution] || 0 : ins.shadowResolution.schema.preset,
            shadowBlur: data.shadowBlur !== undefined ? data.shadowBlur : ins.shadowBlur.schema.preset,
            shadowIntensity: data.shadowIntensity !== undefined ? data.shadowIntensity : ins.shadowIntensity.schema.preset,
        });

        return node.light;
    }

    toDocument(document: IDocument, node: INode): number {
        const ins = this.ins;

        const data = {
            enabled: ins.enabled.value,
            color: ins.color.cloneValue() as ColorRGB,
            intensity: ins.intensity.value,
            sun: {
                datetime: ins.datetime.value,
                latitude: ins.latitude.value,
                longitude: ins.longitude.value,
                intensityFactor: ins.intensityFactor.value,
            }
        } as ILight;

        data.type = CVSunLight.type;

        if (ins.shadowEnabled.value) {
            data.shadowEnabled = true;

            if (!ins.shadowSize.isDefault()) {
                data.shadowSize = ins.shadowSize.value;
            }
            if (!ins.shadowBlur.isDefault()) {
                data.shadowBlur = ins.shadowBlur.value;
            }
            if (!ins.shadowResolution.isDefault()) {
                data.shadowResolution = EShadowMapResolution[ins.shadowResolution.value];
            }
            if (!ins.shadowIntensity.isDefault()) {
                data.shadowIntensity = ins.shadowIntensity.value;
            }
        }

        document.lights = document.lights || [];
        const lightIndex = document.lights.length;
        document.lights.push(data);
        return lightIndex;
    }
}
