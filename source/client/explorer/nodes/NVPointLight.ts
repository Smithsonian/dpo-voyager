/**
 * 3D Foundation Project
 * Copyright 2018 Smithsonian Institution
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

import CPointLight from "@ff/scene/components/CPointLight";

import { ILight } from "common/types/presentation";

import NVLight from "./NVLight";

////////////////////////////////////////////////////////////////////////////////

export default class NVPointLight extends NVLight
{
    static readonly typeName: string = "NVPointLight";

    get light() {
        return this.components.get(CPointLight);
    }

    createComponents()
    {
        super.createComponents();
        this.createComponent(CPointLight);
    }

    fromLightData(data: ILight)
    {
        super.fromLightData(data);

        this.light.ins.copyValues({
            distance: data.point.distance || 0,
            decay: data.point.decay !== undefined ? data.point.decay : 1,
        });
    }

    toLightData(): ILight
    {
        const data = super.toLightData();
        data.type = "point";

        const ins = this.light.ins;

        data.point = {
            distance: ins.distance.value,
            decay: ins.decay.value,
        };

        return data;
    }
}