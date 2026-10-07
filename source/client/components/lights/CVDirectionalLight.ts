/**
 * 3D Foundation Project
 * Copyright 2025 Smithsonian Institution
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import { types } from "@ff/graph/Component";
import CDirectionalLight from "@ff/scene/components/CDirectionalLight";
import { EShadowMapResolution } from "@ff/scene/components/CLight";

import { IDocument, INode, ILight, ColorRGB, TLightType } from "client/schema/document";

import { ICVLight } from "./CVLight";
import CVScene from "../CVScene";

////////////////////////////////////////////////////////////////////////////////

export default class CVDirectionalLight extends CDirectionalLight implements ICVLight
{
    static readonly typeName: string = "CVDirectionalLight";
    static readonly type: TLightType = "directional";

    static readonly text: string = "Directional Light";
    static readonly icon: string = "sun";

    protected static readonly directionalLightIns = {
        rakingEnabled: types.Boolean("Light.RakingEnabled", false),
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

    ins = this.addInputs<CDirectionalLight, typeof CVDirectionalLight["directionalLightIns"]>(CVDirectionalLight.directionalLightIns);

    get settingProperties() {
        return [
            this.ins.name,
            this.ins.enabled,
            this.ins.color,
            this.ins.intensity,
            this.ins.tags,
            this.ins.rakingEnabled,
            this.ins.azimuth,
            this.ins.elevation,
            this.ins.shadowEnabled,
            this.ins.shadowSize,
            this.ins.shadowResolution,
            this.ins.shadowBlur,
            this.ins.shadowIntensity
        ];
    }

    get snapshotProperties() {
        return [
            this.ins.enabled,
            this.ins.color,
            this.ins.intensity,
            this.ins.rakingEnabled,
            this.ins.azimuth,
            this.ins.elevation,
        ];
    }

    update(context)
    {
        const ins = this.ins;

        if (ins.rakingEnabled.changed) {
            if (ins.rakingEnabled.value) {
                if (!ins.azimuth.changed && !ins.elevation.changed) {
                    ins.azimuth.setValue(0);
                    ins.elevation.setValue(15);
                }
            } else {
                ins.position.setValue(ins.position.schema.preset);
                ins.target.setValue(ins.target.schema.preset);
            }
        }

        const result = super.update(context);

        if (ins.rakingEnabled.value && (ins.azimuth.changed || ins.elevation.changed || ins.position.changed || ins.target.changed)) {
            const az = ins.azimuth.value * Math.PI / 180;
            const el = ins.elevation.value * Math.PI / 180;

            const dx = Math.sin(az) * Math.cos(el);
            const dy = Math.sin(el);
            const dz = Math.cos(az) * Math.cos(el);

            this.light.position.set(dx, dy, dz);
            this.light.target.position.set(0, 0, 0);
            this.light.updateMatrix();
            this.light.target.updateMatrix();

            const scene = this.getSystemComponent(CVScene);
            if (scene) {
                const r = Math.max(scene.outs.boundingRadius.value, 1) * 1.2;
                this.transform.ins.position.setValue([dx * r, dy * r, dz * r]);
            }
        }

        return result;
    }

    dispose(): void {
        if(this.ins.shadowEnabled.value && this.light.shadow.map) {
            this.light.shadow.map.dispose();
        }

        super.dispose()
    }

    fromDocument(document: IDocument, node: INode): number
    {
        if (!isFinite(node.light)) {
            throw new Error("light property missing in node");
        }

        const data = document.lights[node.light];
        const ins = this.ins;

        if (data.type !== "directional") {
            throw new Error("light type mismatch: not a directional light");
        }

        ins.name.setValue(node.name);
        data.raking = data.raking || {} as any;

        ins.copyValues({
            enabled: data.enabled !== undefined ? data.enabled : ins.enabled.schema.preset,
            color: data.color !== undefined ? data.color : ins.color.schema.preset,
            intensity: data.intensity !== undefined ? data.intensity : ins.intensity.schema.preset,

            position: ins.position.schema.preset,
            target: ins.target.schema.preset,

            rakingEnabled: data.raking.enabled || false,
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

        const data = {
            enabled: ins.enabled.value,
            color: ins.color.cloneValue() as ColorRGB,
            intensity: ins.intensity.value
        } as ILight;

        if (ins.tags.value) {
            data.tags = ins.tags.value;
        }

        data.type = CVDirectionalLight.type;

        if (ins.rakingEnabled.value) {
            data.raking = {
                enabled: true,
                azimuth: ins.azimuth.value,
                elevation: ins.elevation.value,
            };
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
