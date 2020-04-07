/**
 * 3D Foundation Project
 * Copyright 2019 Smithsonian Institution
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

import parseUrlParameter from "@ff/browser/parseUrlParameter";

import Commander from "@ff/core/Commander";
import TypeRegistry from "@ff/core/TypeRegistry";

import Notification from "@ff/ui/Notification";

import System from "@ff/graph/System";

import coreTypes from "./coreTypes";
import explorerTypes from "./explorerTypes";

import * as documentTemplate from "client/templates/default.svx.json";

import CVDocumentProvider from "../components/CVDocumentProvider";
import CVDocument from "../components/CVDocument";
import CVAssetManager from "../components/CVAssetManager";
import CVAssetReader from "../components/CVAssetReader";
import CVAnalytics from "../components/CVAnalytics";
import CVToolProvider from "../components/CVToolProvider";

import NVEngine from "../nodes/NVEngine";
import NVDocuments from "../nodes/NVDocuments";
import NVTools from "../nodes/NVTools";

import MainView from "../ui/explorer/MainView";
import { EDerivativeQuality } from "client/schema/model";
import MainMenu from "client/ui/explorer/MainMenu";

////////////////////////////////////////////////////////////////////////////////

/**
 * Initial properties of the Voyager Explorer main [[ExplorerApplication]].
 */
export interface IExplorerApplicationProps
{
    /** URL of the root asset folder. */
    root?: string;
    /** URL of the document to load and display at startup. */
    document?: string;
    /** URL of a model (supported formats: gltf, glb) to load and display at startup. */
    model?: string;
    /** URL of a geometry (supported formats: obj, ply) to load and display at startup. */
    geometry?: string;
    /** If a geometry URL is given, optional URL of a color texture to use with the geometry. */
    texture?: string;
    /** If a geometry URL is given, optional URL of a occlusion texture to use with the geometry. */
    occlusion?: string;
    /** If a geometry URL is given, optional URL of a normal texture to use with the geometry. */
    normals?: string;
    /** When loading a model or geometry, the quality level to set for the asset.
        Valid options: "thumb", "low", "medium", "high". */
    quality?: string;
    /** Mode string starts Explorer in a specific ui configuration, i.e. no UI. */
    uiMode?: string;
    /** Name of module being used for scenegraph rendering and control. */
    sceneViewer?: string;
}

/**
 * Voyager Explorer main application.
 */
export default class ExplorerApplication
{
    protected static splashMessage = `
  _________       .__  __  .__                        .__                ________ ________   
 /   _____/ _____ |__|/  |_|  |__   __________   ____ |__|____    ____   \\_____  \\\\______ \\  
 \\_____  \\ /     \\|  \\   __\\  |  \\ /  ___/  _ \\ /    \\|  \\__  \\  /    \\    _(__  < |    |  \\ 
 /        \\  Y Y  \\  ||  | |   Y  \\\\___ (  <_> )   |  \\  |/ __ \\|   |  \\  /       \\|    \`   \\
/_______  /__|_|  /__||__| |___|  /____  >____/|___|  /__(____  /___|  / /______  /_______  /
        \\/      \\/              \\/     \\/           \\/        \\/     \\/         \\/        \\/ 
    
Voyager - 3D Explorer and Tool Suite
3D Foundation Project
(c) 2019 Smithsonian Institution

https://3d.si.edu
https://github.com/smithsonian/dpo-voyager

-----------------------------------------------------
Version: ${ENV_VERSION}
-----------------------------------------------------
    `;

    readonly props: IExplorerApplicationProps;
    readonly system: System;
    readonly commander: Commander;

    protected get assetManager() {
        return this.system.getMainComponent(CVAssetManager);
    }
    protected get assetReader() {
        return this.system.getMainComponent(CVAssetReader);
    }
    protected get documentProvider() {
        return this.system.getMainComponent(CVDocumentProvider);
    }
    protected get analytics() {
        return this.system.getMainComponent(CVAnalytics);
    }

    constructor(parent: HTMLElement, props?: IExplorerApplicationProps, embedded?: boolean)
    {
        this.props = props || {};
        console.log(ExplorerApplication.splashMessage);

        // register components
        const registry = new TypeRegistry();

        registry.add(coreTypes);
        registry.add(explorerTypes);

        this.commander = new Commander();
        const system = this.system = new System(registry);

        const engine = system.graph.createCustomNode(NVEngine);
        system.graph.createCustomNode(NVTools);
        system.graph.createCustomNode(NVDocuments);

        // start timing load
        this.analytics.startTimer(); 
        
        if (parent) {
            // create a view and attach to parent
            new MainView(this).appendTo(parent);
        }
        
        if (!embedded) {
            // initialize default document
            this.documentProvider.createDocument(documentTemplate as any); 
            this.evaluateProps();
        }

        // start rendering
        engine.pulse.start();
    }

    setBaseUrl(url: string)
    {
        this.assetManager.baseUrl = url; 
    }

    loadDocument(documentPath: string, merge?: boolean, quality?: string, uiMode?: string, sceneViewer?: string): Promise<CVDocument>
    {
        const dq = EDerivativeQuality[quality];

        return this.assetReader.getJSON(documentPath)
            .then(data => {
                if (sceneViewer === "model-viewer") {
                    this.assetManager.isEnabled = false;
                }

                merge = merge === undefined ? !data.lights && !data.cameras : merge;
                return this.documentProvider.amendDocument(data, documentPath, merge);
            })
            .then(document => {
                if (isFinite(dq)) {
                    document.setup.viewer.ins.quality.setValue(dq);
                }

                if (uiMode) {
                    if (uiMode === "None") {
                        //document.setup.interface.ins.visible.setValue(false);
                        document.setup.interface.ins.logo.setValue(false);
                        document.setup.interface.ins.menu.setValue(false);
                    }
                }

                if (sceneViewer === "model-viewer") {
                    // trigger update
                    this.assetManager.ins.busy.setValue(false);
                }

                return document;
            });
    }

    loadModel(modelPath: string, quality: string)
    {
        return this.documentProvider.appendModel(modelPath, quality);
    }

    loadGeometry(geoPath: string, colorMapPath?: string,
                 occlusionMapPath?: string, normalMapPath?: string, quality?: string)
    {
        return this.documentProvider.appendGeometry(
            geoPath, colorMapPath, occlusionMapPath, normalMapPath, quality);
    }

    evaluateProps()
    {
        const props = this.props;
        const manager = this.assetManager;

        props.root = props.root || parseUrlParameter("root") || parseUrlParameter("r");
        props.document = props.document || parseUrlParameter("document") || parseUrlParameter("d");
        props.model = props.model || parseUrlParameter("model") || parseUrlParameter("m");
        props.geometry = props.geometry || parseUrlParameter("geometry") || parseUrlParameter("g");
        props.texture = props.texture || parseUrlParameter("texture") || parseUrlParameter("t");
        props.occlusion = props.occlusion || parseUrlParameter("occlusion") || parseUrlParameter("o");
        props.normals = props.normals || parseUrlParameter("normals") || parseUrlParameter("n");
        props.quality = props.quality || parseUrlParameter("quality") || parseUrlParameter("q");
        props.uiMode = props.uiMode || parseUrlParameter("ui") || parseUrlParameter("u");
        props.sceneViewer = props.uiMode || parseUrlParameter("sceneView") || parseUrlParameter("sv");

        const url = props.root || props.document || props.model || props.geometry;
        this.setBaseUrl(new URL(url || ".", window.location as any).href);

        // Due to initializtion order, need to set ui prop here as well as after load to avoid flashing UI changes
        if (props.uiMode) {
            if (props.uiMode === "None") {
                //this.documentProvider.activeComponent.setup.interface.ins.visible.setValue(false);
                this.documentProvider.activeComponent.setup.interface.ins.logo.setValue(false);
                this.documentProvider.activeComponent.setup.interface.ins.menu.setValue(false);
            }
        }

        if (props.document) {
            // first loading priority: document
            props.document = props.root ? props.document : manager.getAssetName(props.document);
            this.loadDocument(props.document, undefined, props.quality, props.uiMode, props.sceneViewer)
            .catch(error => Notification.show(`Failed to load document: ${error.message}`, "error"));
        }
        else if (props.model) {
            // second loading priority: model
            props.model = props.root ? props.model : manager.getAssetName(props.model);
            this.loadModel(props.model, props.quality);
        }
        else if (props.geometry) {
            // third loading priority: geometry (plus optional color texture)
            props.geometry = props.root ? props.geometry : manager.getAssetName(props.geometry);
            props.texture = props.root ? props.texture : manager.getAssetName(props.texture);
            props.occlusion = props.root ? props.occlusion : manager.getAssetName(props.occlusion);
            props.normals = props.root ? props.normals : manager.getAssetName(props.normals);
            this.loadGeometry(props.geometry, props.texture, props.occlusion, props.normals, props.quality);
        }
        else {
            // if nothing else specified, try to read "document.svx.json" from the current folder
            this.loadDocument("document.svx.json", undefined).catch(() => {});
        }
    }
}

window["VoyagerExplorer"] = ExplorerApplication;