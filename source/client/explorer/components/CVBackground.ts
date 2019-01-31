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

import * as THREE from "three";

import { types } from "@ff/graph/propertyTypes";
import CObject3D from "@ff/scene/components/CObject3D";

import { IBackground, EBackgroundType, TBackgroundType } from "common/types/config";

////////////////////////////////////////////////////////////////////////////////

export { EBackgroundType };

const _inputs = {
    type: types.Enum("Background.Type", EBackgroundType),
    color0: types.ColorRGB("Background.Color0", [ 1, 0, 0 ]),
    color1: types.ColorRGB("Background.Color1", [ 0, 1, 0 ])
};

export default class CVBackground extends CObject3D
{
    ins = this.addInputs<CObject3D, typeof _inputs>(_inputs);

    fromData(data: IBackground)
    {
        this.ins.copyValues({
            type: EBackgroundType[data.type] || EBackgroundType.Solid,
            color0: data.color0,
            color1: data.color1
        })
    }

    toData(): IBackground
    {
        const ins = this.ins;

        return {
            type: EBackgroundType[ins.type.value] as TBackgroundType,
            color0: ins.color0.cloneValue(),
            color1: ins.color1.cloneValue()
        };
    }
}