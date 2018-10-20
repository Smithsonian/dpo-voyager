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

import Registry from "@ff/core/ecs/Registry";

import Annotations from "../components/Annotations";
import AnnotationsView from "../components/AnnotationsView";
import Camera from "../components/Camera";
import Collection from "../components/Collection";
import Controller from "../components/Controller";
import DirectionalLight from "../components/DirectionalLight";
import Documents from "../components/Documents";
import PresentationController from "../components/PresentationController";
import Groups from "../components/Groups";
import Hierarchy from "@ff/core/ecs/Hierarchy";
import HomeGrid from "../components/HomeGrid";
import Light from "../components/Light";
import Manip from "../components/Manip";
import Mesh from "../components/Mesh";
import Meta from "../components/Meta";
import Model from "../components/Model";
import Object3D from "../components/Object3D";
import OrbitManip from "../components/OrbitManip";
import PickManip from "../components/PickManip";
import PointLight from "../components/PointLight";
import PoseManip from "../components/PoseManip";
import Process from "../components/Process";
import Reader from "../components/Reader";
import Reference from "../components/Reference";
import RenderController from "../components/RenderController";
import Renderer from "../components/Renderer";
import Scene from "../components/Scene";
import Snapshots from "../components/Snapshots";
import SpotLight from "../components/SpotLight";
import SystemController from "../components/SystemController";
import Tours from "../components/Tours";
import Transform from "../components/Transform";
import ViewController from "../components/ViewController";

////////////////////////////////////////////////////////////////////////////////

export function registerComponents(registry: Registry)
{
    registry.registerComponentType([
        Annotations,
        AnnotationsView,
        Camera,
        Collection,
        Controller,
        DirectionalLight,
        Documents,
        PresentationController,
        Groups,
        Hierarchy,
        HomeGrid,
        Light,
        Manip,
        Mesh,
        Meta,
        Model,
        Object3D,
        OrbitManip,
        PickManip,
        PointLight,
        PoseManip,
        Process,
        Reader,
        Reference,
        RenderController,
        Renderer,
        Scene,
        Snapshots,
        SpotLight,
        SystemController,
        Tours,
        Transform,
        ViewController
    ]);
}