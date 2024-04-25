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

import CHemisphereLight from "@ff/scene/components/CHemisphereLight";

import { IDocument, INode, ILight, ColorRGB, TLightType } from "client/schema/document";

import { ICVLight } from "./CVLight";

////////////////////////////////////////////////////////////////////////////////

export default class CVHemisphereLight extends CHemisphereLight implements ICVLight
{
    static readonly typeName: string = "CVHemisphereLight";
    static readonly type: TLightType = "hemisphere";

    static readonly text: string = "Hemisphere Light";
    static readonly icon: string = "half-sun";

    get settingProperties() {
        return [
            this.ins.color,
            this.ins.intensity,
            this.ins.ground,
        ];
    }

    get snapshotProperties() {
        return [
            this.ins.color,
            this.ins.intensity,
            this.ins.ground,
        ];
    }

    dispose(): void {
        super.dispose()
    }

    fromDocument(document: IDocument, node: INode): number
    {
        if (!isFinite(node.light)) {
            throw new Error("light property missing in node");
        }

        const data = document.lights[node.light];
        const ins = this.ins;

        if (data.type !== CVHemisphereLight.type) {
            throw new Error("light type mismatch: not an hemisphere light");
        }

        data.point = data.point || {} as any;

        ins.copyValues({
            color: data.color !== undefined ? data.color : ins.color.schema.preset,
            intensity: data.intensity !== undefined ? data.intensity : ins.intensity.schema.preset,
            ground: data.hemisphere?.ground ?? ins.ground.schema.preset,
        });

        return node.light;
    }

    toDocument(document: IDocument, node: INode): number
    {
        const ins = this.ins;

        const data = {
            color: ins.color.cloneValue() as ColorRGB,
            intensity: ins.intensity.value,
            hemisphere:{
              ground: ins.ground.cloneValue() as ColorRGB,
            }
        } as ILight;

        data.type = CVHemisphereLight.type;

        document.lights = document.lights || [];
        const lightIndex = document.lights.length;
        document.lights.push(data);
        return lightIndex;
    }
}