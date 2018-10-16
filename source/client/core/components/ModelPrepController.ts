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

import { ISystemComponentEvent } from "@ff/core/ecs/System";

import Model from "./Model";
import Controller from "./Controller";

////////////////////////////////////////////////////////////////////////////////

export default class ModelPrepController extends Controller
{
    static readonly type: string = "ModelPrepController";

    create()
    {
        super.create();
        this.system.addComponentEventListener(Model, this.onModelComponent, this);
    }

    dispose()
    {
        this.system.removeComponentEventListener(Model, this.onModelComponent, this);
        super.dispose();
    }

    protected onModelComponent(event: ISystemComponentEvent<Model>)
    {
    }
}