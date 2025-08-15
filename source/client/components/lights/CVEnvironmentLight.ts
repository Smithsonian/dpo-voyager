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

import CLight from "@ff/scene/components/CLight";

import { IDocument, INode, ILight, ColorRGB, TLightType } from "client/schema/document";

import { ICVLight } from "./CVLight";
import CVEnvironment from "../CVEnvironment";
import { types } from "@ff/graph/Component";
import NVNode from "client/nodes/NVNode";

////////////////////////////////////////////////////////////////////////////////

export default class CVEnvironmentLight extends CLight implements ICVLight
{
    static readonly typeName: string = "CVEnvironmentLight";
    static readonly type: TLightType = "environment";

    static readonly text: string = "Environment Light";
    static readonly icon: string = "globe";

    get settingProperties() {
        return [
            this.ins.intensity,
        ];
    }

    protected environment = null;

    create()
    {
        super.create();

        // link inputs with environment
        this.environment = this.getSystemComponent(CVEnvironment);
        const envIns = this.environment.ins;
        envIns.intensity.linkFrom(this.ins.intensity);

        this.node.name = "Environment";
        (this.node as NVNode).transform.addTag("no_settings");
    }

    update() {
        return true;
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

        if (data.type !== CVEnvironmentLight.type) {
            throw new Error("light type mismatch: not an environment light");
        }

        data.point = data.point || {} as any;

        ins.copyValues({
            intensity: data.intensity !== undefined ? data.intensity : ins.intensity.schema.preset,
        });

        return node.light;
    }

    toDocument(document: IDocument, node: INode): number
    {
        const ins = this.ins;

        const data = {
            intensity: ins.intensity.value,
        } as ILight;

        data.type = CVEnvironmentLight.type;

        document.lights = document.lights || [];
        const lightIndex = document.lights.length;
        document.lights.push(data);
        return lightIndex;
    }
}