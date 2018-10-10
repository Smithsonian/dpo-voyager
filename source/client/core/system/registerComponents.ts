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

import HierarchyComponent from "@ff/core/ecs/Hierarchy";

import PickerComponent from "../components/Picker";
import MainCameraComponent from "../components/MainCamera";
import ManipControllerComponent from "../components/ManipController";
import SelectionControllerComponent from "../components/SelectionController";
import OrbitControllerComponent from "../components/OrbitController";

import SceneComponent from "../components/Scene";
import TransformComponent from "../components/Transform";
import CameraComponent from "../components/Camera";
import LightComponent from "../components/Light";
import DirectionalLightComponent from "../components/DirectionalLight";
import PointLightComponent from "../components/PointLight";
import SpotLightComponent from "../components/SpotLight";
import ReferenceComponent from "../components/Reference";

import MetaComponent from "../components/Meta";
import ProcessComponent from "../components/Process";
import ModelComponent from "../components/Model";
import DerivativesComponent from "../components/Derivatives";
import DocumentsComponent from "../components/Documents";
import GroupsComponent from "../components/Groups";
import SpotAnnotationsComponent from "../components/SpotAnnotations";
import ZoneAnnotationsComponent from "../components/ZoneAnnotations";
import ToursComponent from "../components/Tours";
import SnapshotsComponent from "../components/Snapshots";

import RendererComponent from "../components/Renderer";
import ReaderComponent from "../components/Reader";

import Registry from "@ff/core/ecs/Registry";

////////////////////////////////////////////////////////////////////////////////

export function registerComponents(registry: Registry)
{
    registry.registerComponentType([
        HierarchyComponent,
        PickerComponent,
        MainCameraComponent,
        ManipControllerComponent,
        SelectionControllerComponent,
        OrbitControllerComponent,
        SceneComponent,
        TransformComponent,
        CameraComponent,
        LightComponent,
        DirectionalLightComponent,
        PointLightComponent,
        SpotLightComponent,
        ReferenceComponent,
        MetaComponent,
        ProcessComponent,
        ModelComponent,
        DerivativesComponent,
        DocumentsComponent,
        GroupsComponent,
        SpotAnnotationsComponent,
        ZoneAnnotationsComponent,
        ToursComponent,
        SnapshotsComponent,
        RendererComponent,
        ReaderComponent
    ]);
}