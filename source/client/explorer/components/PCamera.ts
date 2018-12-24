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

import Camera, { EProjectionType } from "@ff/scene/components/Camera";

import { ICamera as ICameraData, ICamera } from "common/types/presentation";
import { types } from "@ff/graph/propertyTypes";

////////////////////////////////////////////////////////////////////////////////

export default class PCamera extends Camera
{
    static readonly type: string = "PCamera";

    fromData(data: ICamera)
    {
        if (data.type === "perspective") {
            this.ins.setValuesByKey({
                projection: EProjectionType.Perspective,
                fov: data.perspective.yfov,
                near: data.perspective.znear,
                far: data.perspective.zfar
            });
        }
        else {
            this.ins.setValuesByKey({
                projection: EProjectionType.Orthographic,
                size: data.orthographic.ymag,
                near: data.orthographic.znear,
                far: data.orthographic.zfar
            });
        }
    }

    toData(): ICamera
    {
        const data: Partial<ICameraData> = {};
        const ins = this.ins;

        if (types.isEnumIndex(EProjectionType.Perspective, ins.projection.value)) {
            data.type = "perspective";
            data.perspective = {
                yfov: ins.fov.value,
                znear: ins.near.value,
                zfar: ins.far.value
            };
        }
        else {
            data.type = "orthographic";
            data.orthographic = {
                ymag: ins.size.value,
                znear: ins.near.value,
                zfar: ins.far.value
            }
        }

        return data as ICameraData;
    }
}