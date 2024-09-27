/**
 * 3D Foundation Project
 * Copyright 2024 Smithsonian Institution
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

import CVSettingsTask from "../components/CVSettingsTask";
import CVPoseTask from "../components/CVPoseTask";
import CVCaptureTask from "../components/CVCaptureTask";
import CVAnnotationsTask from "../components/CVAnnotationsTask";
import CVDerivativesTask from "../components/CVDerivativesTask";
import CVArticlesTask from "../components/CVArticlesTask";
import CVToursTask from "../components/CVToursTask";
import CVOverlayTask from "../components/CVOverlayTask";
import CVAudioTask from "../components/CVAudioTask";

////////////////////////////////////////////////////////////////////////////////

export enum ETaskMode { QC, Authoring, Edit, Expert, Standalone }

export default {
    [ETaskMode.Edit]: [
        CVPoseTask,
        CVCaptureTask,
        CVDerivativesTask,
        CVAnnotationsTask,
        CVArticlesTask,
        CVToursTask,
        //CVOverlayTask,
        CVAudioTask,
        CVSettingsTask,
    ],
    [ETaskMode.QC]: [
        CVPoseTask,
        CVCaptureTask,
        CVDerivativesTask,
        CVSettingsTask,
    ],
    [ETaskMode.Authoring]: [
        CVAnnotationsTask,
        CVArticlesTask,
        CVToursTask,
        CVAudioTask,
        CVSettingsTask,
    ],
    [ETaskMode.Expert]: [
        CVPoseTask,
        CVCaptureTask,
        CVDerivativesTask,
        CVAnnotationsTask,
        CVArticlesTask,
        CVToursTask,
        CVOverlayTask,
        CVAudioTask,
        CVSettingsTask,
    ],
    [ETaskMode.Standalone]: [
        CVPoseTask,
        CVCaptureTask,
        CVDerivativesTask,
        CVAnnotationsTask,
        CVArticlesTask,
        CVToursTask,
        //CVOverlayTask,
        CVAudioTask,
        CVSettingsTask,
    ]
}