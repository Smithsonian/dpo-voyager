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

import types from "@ff/core/ecs/propertyTypes";

import Grid from "../three/Grid";

import Object3D from "./Object3D";
import RenderContext from "../app/RenderContext";

////////////////////////////////////////////////////////////////////////////////

export default class HomeGrid extends Object3D
{
    static readonly type: string = "Grid";

    ins = this.makeProps({
        sca: types.Number("Scale", 1)
    });

    create()
    {
        super.create();

        this.object3D = new Grid({
            size: 20,
            mainDivisions: 2,
            subDivisions: 10,
            mainColor: "#c0c0c0",
            subColor: "#606060"
        });
    }

    update()
    {

    }

    render(context: RenderContext)
    {

    }

    get grid()
    {
        return this.object3D as Grid;
    }
}