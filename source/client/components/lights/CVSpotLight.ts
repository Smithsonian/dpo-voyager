/**
 * 3D Foundation Project
 * Copyright 2019 Smithsonian Institution
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

import CSpotLight from "@ff/scene/components/CSpotLight";

import { IDocument, INode, ILight, ColorRGB, TLightType } from "client/schema/document";

import { ICVLight } from "./CVLight";
import { EShadowMapResolution } from "@ff/scene/components/CLight";

////////////////////////////////////////////////////////////////////////////////

export default class CVSpotLight extends CSpotLight implements ICVLight
{
    static readonly typeName: string = "CVSpotLight";
    static readonly type: TLightType = "spot";

    static readonly text: string = "Spot Light";
    static readonly icon: string = "spot";

    get settingProperties() {
        return [
            this.ins.color,
            this.ins.intensity,
            this.ins.distance,
            this.ins.decay,
            this.ins.angle,
            this.ins.penumbra,
            this.ins.shadowEnabled,
            this.ins.shadowResolution,
            this.ins.shadowBlur,
        ];
    }

    get snapshotProperties() {
        return [
            this.ins.color,
            this.ins.intensity
        ];
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

        if (data.type !== CVSpotLight.type) {
            throw new Error("light type mismatch: not a spot light");
        }

        data.spot = data.spot || {} as any;

        ins.copyValues({
            color: data.color !== undefined ? data.color : ins.color.schema.preset,
            intensity: data.intensity !== undefined ? data.intensity : ins.intensity.schema.preset,

            position: ins.position.schema.preset,
            target: ins.target.schema.preset,

            distance: data.spot.distance || ins.distance.schema.preset,
            decay: data.spot.decay !== undefined ? data.spot.decay : ins.decay.schema.preset,
            angle: data.spot.angle !== undefined ? data.spot.angle : ins.angle.schema.preset,
            penumbra: data.spot.penumbra || ins.penumbra.schema.preset,

            shadowEnabled: data.shadowEnabled || false,
            shadowResolution: data.shadowResolution !== undefined ? EShadowMapResolution[data.shadowResolution] || 1 : 1,
            shadowBlur: data.shadowBlur !== undefined ? data.shadowBlur : ins.shadowBlur.schema.preset,
        });

        return node.light;
    }

    toDocument(document: IDocument, node: INode): number
    {
        const ins = this.ins;

        const data = {
            color: ins.color.cloneValue() as ColorRGB,
            intensity: ins.intensity.value,
            spot: {
                distance: ins.distance.value,
                decay: ins.decay.value,
                angle: ins.angle.value,
                penumbra: ins.penumbra.value,
            },
        } as ILight;

        data.type = CVSpotLight.type;

        if (ins.shadowEnabled.value) {
            data.shadowEnabled = true;

            if (!ins.shadowBlur.isDefault()) {
                data.shadowBlur = ins.shadowBlur.value;
            }
            if (!ins.shadowResolution.isDefault()) {
                data.shadowResolution = EShadowMapResolution[ins.shadowResolution.value];
            }
        }

        document.lights = document.lights || [];
        const lightIndex = document.lights.length;
        document.lights.push(data);
        return lightIndex;
    }
}