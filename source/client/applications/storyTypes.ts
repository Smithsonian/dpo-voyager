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

import CVStoryApplication from "../components/CVStoryApplication";
import CVAssetWriter from "../components/CVAssetWriter";

import CVTaskProvider from "../components/CVTaskProvider";

import CVExploreTask from "../components/CVExploreTask";
import CVPoseTask from "../components/CVPoseTask";
import CVCaptureTask from "../components/CVCaptureTask";
import CVAnnotationsTask from "../components/CVAnnotationsTask";
import CVArticlesTask from "../components/CVArticlesTask";
import CVToursTask from "../components/CVToursTask";
import CVDerivativesTask from "../components/CVDerivativesTask";

import NVVoyagerStory from "../nodes/NVoyagerStory";
import NVTasks from "../nodes/NVTasks";


////////////////////////////////////////////////////////////////////////////////

const types = [
    CVStoryApplication,
    CVAssetWriter,

    CVTaskProvider,
    CVExploreTask,
    CVPoseTask,
    CVCaptureTask,
    CVAnnotationsTask,
    CVArticlesTask,
    CVToursTask,
    CVDerivativesTask,

    NVVoyagerStory,
    NVTasks,
];

export default types;