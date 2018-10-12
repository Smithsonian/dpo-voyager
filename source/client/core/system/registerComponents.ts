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

import Hierarchy from "@ff/core/ecs/Hierarchy";

import PickManip from "../components/PickManip";
import MainCamera from "../components/MainCamera";
import Manip from "../components/Manip";
import SelectionManip from "../components/SelectionManip";
import OrbitManip from "../components/OrbitManip";

import Scene from "../components/Scene";
import Transform from "../components/Transform";
import Camera from "../components/Camera";
import Light from "../components/Light";
import DirectionalLight from "../components/DirectionalLight";
import PointLight from "../components/PointLight";
import SpotLight from "../components/SpotLight";
import Reference from "../components/Reference";

import Meta from "../components/Meta";
import Process from "../components/Process";
import Model from "../components/Model";
import Derivatives from "../components/Derivatives";
import Documents from "../components/Documents";
import Groups from "../components/Groups";
import SpotAnnotations from "../components/SpotAnnotations";
import ZoneAnnotations from "../components/ZoneAnnotations";
import Tours from "../components/Tours";
import Snapshots from "../components/Snapshots";

import Renderer from "../components/Renderer";
import Reader from "../components/Reader";

import Registry from "@ff/core/ecs/Registry";

////////////////////////////////////////////////////////////////////////////////

export function registerComponents(registry: Registry)
{
    registry.registerComponentType([
        Hierarchy,
        PickManip,
        MainCamera,
        Manip,
        SelectionManip,
        OrbitManip,
        Scene,
        Transform,
        Camera,
        Light,
        DirectionalLight,
        PointLight,
        SpotLight,
        Reference,
        Meta,
        Process,
        Model,
        Derivatives,
        Documents,
        Groups,
        SpotAnnotations,
        ZoneAnnotations,
        Tours,
        Snapshots,
        Renderer,
        Reader
    ]);
}