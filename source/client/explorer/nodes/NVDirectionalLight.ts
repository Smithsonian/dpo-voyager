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

import CDirectionalLight from "@ff/scene/components/CDirectionalLight";

import { ILight } from "common/types/presentation";

import NVLight from "./NVLight";

////////////////////////////////////////////////////////////////////////////////

export default class NVDirectionalLight extends NVLight
{
    static readonly typeName: string = "NVDirectionalLight";

    get light() {
        return this.components.get(CDirectionalLight);
    }

    createComponents()
    {
        super.createComponents();
        this.createComponent(CDirectionalLight);
    }

    fromLightData(data: ILight)
    {
        super.fromLightData(data);

        this.light.ins.copyValues({
            position: [ 0, 0, 0 ],
            target: [ 0, 0, 0 ],
        });
    }

    toLightData(): ILight
    {
        const data = super.toLightData();
        data.type = "directional";
        return data;

    }
}