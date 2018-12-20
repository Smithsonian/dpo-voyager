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

import { Node } from "@ff/graph";

import Main from "@ff/scene/components/Main";
import Scene from "@ff/scene/components/Scene";
import OrbitManipulator from "@ff/scene/components/OrbitManipulator";

import Renderer from "../components/Renderer";
import Reader from "../components/Reader";

////////////////////////////////////////////////////////////////////////////////

export default class Explorer extends Node
{
    static readonly type: string = "Explorer";

    get scene() {
        return this.components.get(Scene);
    }

    create()
    {
        this.name = "Explorer";

        this.createComponent(Renderer);
        this.createComponent(Reader);
        this.createComponent(Main);
        this.createComponent(Scene);
        this.createComponent(OrbitManipulator);

        this.scene.scene.background = new THREE.TextureLoader().load("images/bg-gradient-blue.jpg");
    }
}