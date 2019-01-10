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
import Object3D from "@ff/scene/components/Object3D";

import { IGroundPlane } from "common/types/voyager";

////////////////////////////////////////////////////////////////////////////////

export default class GroundPlane extends Object3D
{
    static readonly type: string = "GroundPlane";

    ins = this.ins.append({
        visible: types.Boolean("Visible"),
        offset: types.Number("Offset"),
        color: types.ColorRGB("Color", [ 0, 0, 1 ]),
        shadowVisible: types.Boolean("Shadow.Visible"),
        shadowColor: types.ColorRGBA("Shadow.Color")
    });

    fromData(data: IGroundPlane)
    {
        this.ins.copyValues({
            visible: data.visible,
            offset: data.offset,
            color: data.color,
            shadowVisible: data.shadowVisible,
            shadowColor: data.shadowColor
        });
    }

    toData(): IGroundPlane
    {
        const ins = this.ins;

        return {
            visible: ins.visible.cloneValue(),
            offset: ins.offset.cloneValue(),
            color: ins.color.cloneValue(),
            shadowVisible: ins.shadowVisible.cloneValue(),
            shadowColor: ins.shadowColor.cloneValue()
        };
    }
}