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

import StoryAppController from "./components/StoryAppController";
import SelectionController from "./components/SelectionController";
import AnnotationsEditController from "./components/AnnotationsEditController";
import ToursEditController from "./components/ToursEditController";
import PoseEditController from "./components/PoseEditController";

import ViewportCameraManip from "./components/ViewportCameraManip";
import PoseManip from "./components/PoseManip";

////////////////////////////////////////////////////////////////////////////////

export function registerComponents(registry: Registry)
{
    registry.registerComponentType([
        StoryAppController,
        SelectionController,
        AnnotationsEditController,
        ToursEditController,
        PoseEditController,
        ViewportCameraManip,
        PoseManip,
    ]);
}