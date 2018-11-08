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

import Controller from "../components/Controller";
import PresentationController from "../components/PresentationController";
import SystemController from "../components/SystemController";
import AnnotationsController from "../components/AnnotationsController";
import ToursController from "../components/ToursController";

import Annotations from "../components/Annotations";
import AnnotationsView from "../components/AnnotationsView";
import Camera from "../components/Camera";
import Collection from "../components/Collection";
import DirectionalLight from "../components/DirectionalLight";
import Documents from "../components/Documents";
import Explorer from "../components/Explorer";
import Groups from "../components/Groups";
import Hierarchy from "@ff/core/ecs/Hierarchy";
import HomeGrid from "../components/HomeGrid";
import Item from "../components/Item";
import Light from "../components/Light";
import Manip from "../components/Manip";
import Mesh from "../components/Mesh";
import Model from "../components/Model";
import Object3D from "../components/Object3D";
import OrbitManip from "../components/OrbitManip";
import PickManip from "../components/PickManip";
import PointLight from "../components/PointLight";
import PoseManip from "../components/PoseManip";
import Presentation from "../components/Presentation";
import Process from "../components/Process";
import Reference from "../components/Reference";
import Renderer from "../components/Renderer";
import Scene from "../components/Scene";
import Snapshots from "../components/Snapshots";
import SpotLight from "../components/SpotLight";
import Tours from "../components/Tours";
import Transform from "../components/Transform";

////////////////////////////////////////////////////////////////////////////////

export function registerComponents(registry: Registry)
{
    registry.registerComponentType([
        Annotations,
        AnnotationsController,
        AnnotationsView,
        Camera,
        Collection,
        Controller,
        DirectionalLight,
        Documents,
        Explorer,
        PresentationController,
        Groups,
        Hierarchy,
        HomeGrid,
        Item,
        Light,
        Manip,
        Mesh,
        Model,
        Object3D,
        OrbitManip,
        PickManip,
        PointLight,
        PoseManip,
        Presentation,
        Process,
        Reference,
        Renderer,
        Scene,
        Snapshots,
        SpotLight,
        SystemController,
        Tours,
        ToursController,
        Transform
    ]);
}