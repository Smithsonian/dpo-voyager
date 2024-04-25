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

// LIBRARY COMPONENTS //////////////////////////////////////////////////////////

import CGraph from "@ff/graph/components/CGraph";
import CPulse from "@ff/graph/components/CPulse";
import CComponentProvider from "@ff/graph/components/CComponentProvider";
import CNodeProvider from "@ff/graph/components/CNodeProvider";
import CTweenMachine from "@ff/graph/components/CTweenMachine";

import CRenderer from "@ff/scene/components/CRenderer";

import CFullscreen from "@ff/scene/components/CFullscreen";
import CPickSelection from "@ff/scene/components/CPickSelection";
import CScene from "@ff/scene/components/CScene";

// LIBRARY NODES ///////////////////////////////////////////////////////////////

import Node from "@ff/graph/Node";

// PROJECT COMPONENTS //////////////////////////////////////////////////////////

import CVAnalytics from "../components/CVAnalytics";

import CVAssetManager from "../components/CVAssetManager";
import CVAssetReader from "../components/CVAssetReader";
import CVDocument from "../components/CVDocument";
import CVDocumentProvider from "../components/CVDocumentProvider";

import CVScene from "../components/CVScene";
import CVSetup from "../components/CVSetup";
import CVNode from "../components/CVNode";
import CVMeta from "../components/CVMeta";
import CVModel2 from "../components/CVModel2";
import CVAnnotations from "../components/CVAnnotations";
import CVAnnotationView from "../components/CVAnnotationView";
import CVStaticAnnotationView from "client/components/CVStaticAnnotationView";
import CVCamera from "../components/CVCamera";
import CVDirectionalLight from "../components/lights/CVDirectionalLight";
import CVPointLight from "../components/lights/CVPointLight";
import CVSpotLight from "../components/lights/CVSpotLight";

import CVInterface from "../components/CVInterface";
import CVViewer from "../components/CVViewer";
import CVReader from "../components/CVReader";
import CVOrbitNavigation from "../components/CVOrbitNavigation";
import CVBackground from "../components/CVBackground";
import CVFloor from "../components/CVFloor";
import CVGrid from "../components/CVGrid";
import CVTape from "../components/CVTape";
import CVSlicer from "../components/CVSlicer";
import CVTours from "../components/CVTours";
import CVSnapshots from "../components/CVSnapshots";
import CVEnvironment from "../components/CVEnvironment";
import CVARManager from "../components/CVARManager";
import CVLanguageManager from "../components/CVLanguageManager";
import CVAudioManager from "client/components/CVAudioManager";

// PROJECT NODES ///////////////////////////////////////////////////////////////

import NVEngine from "../nodes/NVEngine";
import NVDocuments from "../nodes/NVDocuments";
import NVScene from "../nodes/NVScene";
import NVNode from "../nodes/NVNode";

import CVAmbientLight from "client/components/lights/CVAmbientLight";
import CVHemisphereLight from "client/components/lights/CVHemisphereLight";
import CVRectLight from "client/components/lights/CVRectLight";


////////////////////////////////////////////////////////////////////////////////

export const lightTypes = [
    CVDirectionalLight,
    CVPointLight,
    CVSpotLight,
    CVAmbientLight,
    CVHemisphereLight,
    CVRectLight,
] as const;

const types = [
    CGraph,
    CPulse,
    CComponentProvider,
    CNodeProvider,
    CTweenMachine,
    CRenderer,
    CFullscreen,
    CPickSelection,
    CScene,

    Node,

    CVAnalytics,
    CVARManager,
    CVAssetManager,
    CVAssetReader,
    CVDocument,
    CVDocumentProvider,

    CVScene,
    CVSetup,
    CVNode,
    CVMeta,
    CVModel2,
    CVAnnotations,
    CVAnnotationView,
    CVStaticAnnotationView,
    CVCamera,
    ...lightTypes,

    CVInterface,
    CVViewer,
    CVReader,
    CVOrbitNavigation,
    CVBackground,
    CVFloor,
    CVGrid,
    CVTape,
    CVSlicer,
    CVTours,
    CVSnapshots,
    CVEnvironment,
    CVLanguageManager,
    CVAudioManager,

    NVEngine,
    NVDocuments,
    NVScene,
    NVNode,
];

export default types;