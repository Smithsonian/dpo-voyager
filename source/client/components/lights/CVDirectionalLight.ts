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

import CDirectionalLight from "@ff/scene/components/CDirectionalLight";
import { Node } from "@ff/graph/Component";

import { IDocument, INode, ILight, ColorRGB, TLightType } from "client/schema/document";

import { ICVLight } from "./CVLight";
import { EShadowMapResolution } from "@ff/scene/components/CLight";
import CVNode from "../CVNode";

////////////////////////////////////////////////////////////////////////////////

export default class CVDirectionalLight extends CDirectionalLight implements ICVLight
{
    static readonly typeName: string = "CVDirectionalLight";
    static readonly type: TLightType = "directional";

    static readonly text: string = "Directional Light";
    static readonly icon: string = "sun";

    get settingProperties() {
        return [
            this.ins.color,
            this.ins.intensity,
            this.ins.shadowEnabled,
            this.ins.shadowSize,
            this.ins.shadowResolution,
            this.ins.shadowBlur,
        ];
    }

    get snapshotProperties() {
        return [
            this.ins.color,
            this.ins.intensity,
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

        if (data.type !== "directional") {
            throw new Error("light type mismatch: not a directional light");
        }

        ins.copyValues({
            color: data.color !== undefined ? data.color : ins.color.schema.preset,
            intensity: data.intensity !== undefined ? data.intensity : ins.intensity.schema.preset,

            position: ins.position.schema.preset,
            target: ins.target.schema.preset,

            shadowEnabled: data.shadowEnabled || false,
            shadowSize: data.shadowSize !== undefined ? data.shadowSize : ins.shadowSize.schema.preset,
            shadowResolution: data.shadowResolution !== undefined ? EShadowMapResolution[data.shadowResolution] || 0 : ins.shadowResolution.schema.preset,
            shadowBlur: data.shadowBlur !== undefined ? data.shadowBlur : ins.shadowBlur.schema.preset,
        });

        return node.light;
    }

    toDocument(document: IDocument, node: INode): number
    {
        const ins = this.ins;

        const data = {
            color: ins.color.cloneValue() as ColorRGB,
            intensity: ins.intensity.value
        } as ILight;

        data.type = CVDirectionalLight.type;

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
        }

        document.lights = document.lights || [];
        const lightIndex = document.lights.length;
        document.lights.push(data);
        return lightIndex;
    }
}