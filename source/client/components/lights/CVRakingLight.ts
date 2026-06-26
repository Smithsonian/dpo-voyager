/**
* Funded by the Netherlands eScience Center in the context of the
* [Dynamic 3D]{@link https://research-software-directory.org/projects/dynamic3d} project
*
* @author Carsten Schnober <c.schnober@esciencecenter.nl>
*/

import { IUpdateContext, types } from "@ff/graph/Component";
import CDirectionalLight from "@ff/scene/components/CDirectionalLight";
import { EShadowMapResolution } from "@ff/scene/components/CLight";

import { ColorRGB, IDocument, ILight, INode, TLightType } from "client/schema/document";
import CVScene from "../CVScene";
import { ICVLight } from "./CVLight";

////////////////////////////////////////////////////////////////////////////////

/**
 * Raking Light - a directional light placed at a very low angle
 * relative to the object surface, controlled by azimuth and elevation angles.
 *
 * Raking light is used in museum/conservation contexts to reveal surface texture
 * by illuminating objects at a shallow angle (typically 5–30° elevation).
 */
export default class CVRakingLight extends CDirectionalLight implements ICVLight
{
    static readonly typeName: string = "CVRakingLight";
    static readonly type: TLightType = "raking";

    static readonly text: string = "Raking Light";
    static readonly icon: string = "half-sun";

    protected static readonly rakingLightIns = {
        azimuth: types.Number("Raking.Azimuth", {
            preset: 0,
            min: 0,
            max: 360,
        }),
        elevation: types.Number("Raking.Elevation", {
            preset: 15,
            min: 0,
            max: 90,
        }),
    };

    ins = this.addInputs<CDirectionalLight, typeof CVRakingLight["rakingLightIns"]>(CVRakingLight.rakingLightIns);

    get settingProperties() {
        return [
            this.ins.name,
            this.ins.enabled,
            this.ins.color,
            this.ins.intensity,
            this.ins.tags,
            this.ins.azimuth,
            this.ins.elevation,
            this.ins.shadowEnabled,
            this.ins.shadowSize,
            this.ins.shadowResolution,
            this.ins.shadowBlur,
            this.ins.shadowIntensity,
        ];
    }

    get snapshotProperties() {
        return [
            this.ins.enabled,
            this.ins.color,
            this.ins.intensity,
            this.ins.azimuth,
            this.ins.elevation,
        ];
    }

    update(context: IUpdateContext)
    {
        const ins = this.ins;

        const result = super.update(context);

        if (ins.azimuth.changed || ins.elevation.changed || ins.position.changed || ins.target.changed) {
            const az = ins.azimuth.value * Math.PI / 180;
            const el = ins.elevation.value * Math.PI / 180;

            // Direction FROM which the light comes (unit vector).
            // Elevation is the angle above the horizontal plane; azimuth rotates around Y.
            const dx = Math.sin(az) * Math.cos(el);
            const dy = Math.sin(el);
            const dz = Math.cos(az) * Math.cos(el);

            this.light.position.set(dx, dy, dz);
            this.light.target.position.set(0, 0, 0);
            this.light.updateMatrix();
            this.light.target.updateMatrix();

            const scene = this.getSystemComponent(CVScene);
            if (scene) {
                const radius = Math.max(scene.outs.boundingRadius.value, 1) * 1.2;
                this.transform.ins.position.setValue([dx * radius, dy * radius, dz * radius]);
            }
        }

        return result;
    }

    dispose(): void {
        if (this.ins.shadowEnabled.value && this.light.shadow.map) {
            this.light.shadow.map.dispose();
        }
        super.dispose();
    }

    fromDocument(document: IDocument, node: INode): number
    {
        if (!isFinite(node.light)) {
            throw new Error("light property missing in node");
        }

        const data = document.lights[node.light];
        const ins = this.ins;

        if (data.type !== CVRakingLight.type) {
            throw new Error("light type mismatch: not a raking light");
        }

        ins.name.setValue(node.name);
        data.raking = data.raking || {} as any;

        ins.copyValues({
            enabled: data.enabled !== undefined ? data.enabled : ins.enabled.schema.preset,
            color: data.color !== undefined ? data.color : ins.color.schema.preset,
            intensity: data.intensity !== undefined ? data.intensity : ins.intensity.schema.preset,

            position: ins.position.schema.preset,
            target: ins.target.schema.preset,

            azimuth: data.raking.azimuth !== undefined ? data.raking.azimuth : ins.azimuth.schema.preset,
            elevation: data.raking.elevation !== undefined ? data.raking.elevation : ins.elevation.schema.preset,

            shadowEnabled: data.shadowEnabled || false,
            shadowSize: data.shadowSize !== undefined ? data.shadowSize : ins.shadowSize.schema.preset,
            shadowResolution: data.shadowResolution !== undefined ? EShadowMapResolution[data.shadowResolution] || 0 : ins.shadowResolution.schema.preset,
            shadowBlur: data.shadowBlur !== undefined ? data.shadowBlur : ins.shadowBlur.schema.preset,
            shadowIntensity: data.shadowIntensity !== undefined ? data.shadowIntensity : ins.shadowIntensity.schema.preset,
        });
        ins.tags.setValue(data.tags || "");

        return node.light;
    }

    toDocument(document: IDocument, node: INode): number
    {
        const ins = this.ins;

        const data: ILight = {
            enabled: ins.enabled.value,
            color: ins.color.cloneValue() as ColorRGB,
            intensity: ins.intensity.value,
            raking: {
                azimuth: ins.azimuth.value,
                elevation: ins.elevation.value,
            },
            type: CVRakingLight.type,
        };

        if (ins.tags.value) {
            data.tags = ins.tags.value;
        }

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
