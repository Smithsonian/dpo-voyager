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

import { IDocument, INode, ILight, ColorRGB } from "common/types/document";

import { ICVLight } from "./CVLight";

////////////////////////////////////////////////////////////////////////////////

export default class CVSpotLight extends CSpotLight implements ICVLight
{
    static readonly typeName: string = "CVSpotLight";

    get snapshotKeys() {
        return [ "color", "intensity" ];
    }

    fromDocument(document: IDocument, node: INode): number
    {
        if (!isFinite(node.light)) {
            throw new Error("light property missing in node");
        }

        const data = document.lights[node.light];

        if (data.type !== "point") {
            throw new Error("light type mismatch: not a point light");
        }

        this.ins.copyValues({
            color: data.color !== undefined ? data.color : [ 1, 1, 1 ],
            intensity: data.intensity !== undefined ? data.intensity : 1,
            distance: data.spot.distance || 0,
            decay: data.spot.decay !== undefined ? data.spot.decay : 1,
            angle: data.spot.angle !== undefined ? data.spot.angle : Math.PI / 4,
            penumbra: data.spot.penumbra || 0,
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

        data.type = "spot";

        document.lights = document.lights || [];
        const lightIndex = document.lights.length;
        document.lights.push(data);
        return lightIndex;
    }
}