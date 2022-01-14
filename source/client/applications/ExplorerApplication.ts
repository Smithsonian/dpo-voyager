/**
 * 3D Foundation Project
 * Copyright 2021 Smithsonian Institution
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

import documentTemplate from "client/templates/default.svx.json";

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
import CVARManager from "client/components/CVARManager";
import { EUIElements } from "client/components/CVInterface";
import { EBackgroundStyle } from "client/schema/setup";
import CRenderer from "client/../../libs/ff-scene/source/components/CRenderer";

import { clamp } from "client/utils/Helpers"
import CVScene from "client/components/CVScene";
import CVAnnotationView from "client/components/CVAnnotationView";

////////////////////////////////////////////////////////////////////////////////

/**
 * Initial properties of the Voyager Explorer main [[ExplorerApplication]].
 */
export interface IExplorerApplicationProps
{
    /** URL of the root asset folder. */
    root?: string;
    /** Custom URL to Draco files (Defaults to online CDN). */
    dracoRoot?: string;
    /** Custom URL to resource files (Defaults to online CDN). */
    resourceRoot?: string;
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
    /** Component background colors */
    bgColor?: string;
    /** Component background style */
    bgStyle?: string;
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
(c) 2021 Smithsonian Institution

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

        //*** Support message passing over channel 2 ***//	
        /*{	
            // Add listener for the intial port transfer message	
            var port2;	
            window.addEventListener('message', initPort);	

            // Setup port for message passing	
            function initPort(e) {	
                port2 = e.ports[0];	
                if(port2) {	
                    port2.onmessage = onMessage;	
                }	
            }	

            // Handle messages received on port2	
            function onMessage(e) {	
                if (ENV_DEVELOPMENT) {	
                    console.log('Message received by VoyagerExplorer: "' + e.data + '"');	
                }	

                const analytics = system.getMainComponent(CVAnalytics);	

                if (e.data === "enableAR") {
                    const ARIns = system.getMainComponent(CVARManager).ins;

                    ARIns.enabled.setValue(true);
                    analytics.sendProperty("AR.enabled", true);
                }

            }	
        }*/

        // Temporary hack to work around iOS 15+ texture memory issue
        const IS_IOS = /^(iPad|iPhone|iPod)/.test(window.navigator.platform) ||
            (/^Mac/.test(window.navigator.platform) && window.navigator.maxTouchPoints > 1);
        if (IS_IOS) {
            window.createImageBitmap = undefined;
        }

        // start rendering
        engine.pulse.start();
    }

    dispose()
    {
        // Clean up assuming a component disconnect means it won't be reconnected
        this.assetReader.dispose();
        this.documentProvider.activeComponent.clearNodeTree();
        this.system.getMainComponent(CRenderer).views.forEach(view => view.dispose());
        //this.documentProvider.activeComponent.setup.node.dispose();
        //this.system.graph.clear();
        this.documentProvider.activeComponent.setup.tape.dispose();
        this.documentProvider.activeComponent.setup.floor.dispose();
        this.documentProvider.activeComponent.setup.grid.dispose();
    }

    setBaseUrl(url: string)
    {
        this.assetManager.baseUrl = url; 
    }

    loadDocument(documentPath: string, merge?: boolean, quality?: string): Promise<CVDocument>
    {
        const dq = EDerivativeQuality[quality];

        return this.assetReader.getJSON(documentPath)
            .then(data => {
                merge = merge === undefined ? !data.lights && !data.cameras : merge;
                return this.documentProvider.amendDocument(data, documentPath, merge);
            })
            .then(document => {
                if (isFinite(dq)) {
                    document.setup.viewer.ins.quality.setValue(dq);
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
        props.dracoRoot = props.dracoRoot || parseUrlParameter("dracoRoot") || parseUrlParameter("dr");
        props.resourceRoot = props.resourceRoot || parseUrlParameter("resourceRoot") || parseUrlParameter("rr");
        props.document = props.document || parseUrlParameter("document") || parseUrlParameter("d");
        props.model = props.model || parseUrlParameter("model") || parseUrlParameter("m");
        props.geometry = props.geometry || parseUrlParameter("geometry") || parseUrlParameter("g");
        props.texture = props.texture || parseUrlParameter("texture") || parseUrlParameter("t");
        props.occlusion = props.occlusion || parseUrlParameter("occlusion") || parseUrlParameter("o");
        props.normals = props.normals || parseUrlParameter("normals") || parseUrlParameter("n");
        props.quality = props.quality || parseUrlParameter("quality") || parseUrlParameter("q");
        props.uiMode = props.uiMode || parseUrlParameter("uiMode") || parseUrlParameter("u");
        props.bgColor = props.bgColor || parseUrlParameter("bgColor") || parseUrlParameter("bc");
        props.bgStyle = props.bgStyle || parseUrlParameter("bgStyle") || parseUrlParameter("bs");

        const url = props.root || props.document || props.model || props.geometry;
        this.setBaseUrl(new URL(url || ".", window.location as any).href);

        // Config custom UI layout
        if (props.uiMode) {
            //if (props.uiMode.toLowerCase().indexOf("none") !== -1) {
            //    this.documentProvider.activeComponent.setup.interface.ins.visibleElements.setValue(0);
            //}

            let elementValues = 0;
            let hasValidParam = false;
            
            const enumNames = Object.values(EUIElements).filter(value => typeof value === 'string') as string[];
            const uiParams = props.uiMode.split('|');
            uiParams.forEach(param => { 
                const stdParam = param.toLowerCase();
                if(enumNames.includes(stdParam)) {
                    elementValues += EUIElements[stdParam];
                    hasValidParam = true;
                }
            });

            if(hasValidParam) {
                this.documentProvider.activeComponent.setup.interface.ins.visibleElements.setValue(elementValues);
            }
        }

        if(props.dracoRoot) {
            // Set custom Draco path
            this.assetReader.setDracoPath(props.dracoRoot);
        }

        if(props.resourceRoot) {
            // Set custom resource path
            this.assetReader.setSystemAssetPath(props.resourceRoot);
        }

        if (props.document) {
            // first loading priority: document
            props.document = props.root ? props.document : manager.getAssetName(props.document);
            this.loadDocument(props.document, undefined, props.quality)
            .then(() => this.postLoadHandler(props))
            .catch(error => Notification.show(`Failed to load document: ${error.message}`, "error"));
        }
        else if (props.model) {
            // second loading priority: model
            props.model = props.root ? props.model : manager.getAssetName(props.model);

            this.assetReader.getText(props.model)       // make sure we have a valid model path
            .then(() => {
                this.loadModel(props.model, props.quality);
                this.postLoadHandler(props);
            })
            .catch(error => Notification.show(`Bad Model Path: ${error.message}`, "error"));
        }
        else if (props.geometry) {
            // third loading priority: geometry (plus optional color texture)
            props.geometry = props.root ? props.geometry : manager.getAssetName(props.geometry);
            props.texture = props.root ? props.texture : manager.getAssetName(props.texture);
            props.occlusion = props.root ? props.occlusion : manager.getAssetName(props.occlusion);
            props.normals = props.root ? props.normals : manager.getAssetName(props.normals);

            this.assetReader.getText(props.geometry)    // make sure we have a valid geometry path   
            .then(() => {
                this.loadGeometry(props.geometry, props.texture, props.occlusion, props.normals, props.quality);
                this.postLoadHandler(props);
            })
            .catch(error => Notification.show(`Bad Geometry Path: ${error.message}`, "error"));
        }
        else if (props.root) {
            // if nothing else specified, try to read "scene.svx.json" from the current folder
            this.loadDocument("scene.svx.json", undefined)
            .then(() => this.postLoadHandler(props))
            .catch(() => {});
        }
    }

    protected postLoadHandler(props: IExplorerApplicationProps) {
        this.assetManager.ins.baseUrlValid.setValue(true);
        if(props.bgColor) {
            const colors = props.bgColor.split(" ");
            this.setBackgroundColor(colors[0], colors[1] || null);
        }
        if(props.bgStyle) {
            this.setBackgroundStyle(props.bgStyle);
        }
    }

    ////////////////////////////////////////////
    //** API functions for external control **//
    ////////////////////////////////////////////
    toggleAnnotations()
    {
        const viewerIns = this.system.getMainComponent(CVDocumentProvider).activeComponent.setup.viewer.ins;
        const toolIns = this.system.getMainComponent(CVToolProvider).ins;

        if (toolIns.visible.value) {
            toolIns.visible.setValue(false);
        }

        viewerIns.annotationsVisible.setValue(!viewerIns.annotationsVisible.value);
        this.analytics.sendProperty("Annotations.Visible", viewerIns.annotationsVisible.value);
    }

    toggleReader()
    {
        const readerIns = this.system.getMainComponent(CVDocumentProvider).activeComponent.setup.reader.ins;
                    
        readerIns.enabled.setValue(!readerIns.enabled.value);
        this.analytics.sendProperty("Reader.Enabled", readerIns.enabled.value);
    }

    toggleTours()
    {
        const tourIns = this.system.getMainComponent(CVDocumentProvider).activeComponent.setup.tours.ins;
        const readerIns = this.system.getMainComponent(CVDocumentProvider).activeComponent.setup.reader.ins;

        if (tourIns.enabled.value) {
            tourIns.enabled.setValue(false);
        }
        else {
            if (readerIns.enabled.value) {
                readerIns.enabled.setValue(false); // disable reader
            }

            tourIns.enabled.setValue(true); // enable tours
            tourIns.tourIndex.setValue(-1); // show tour menu
        }

        this.analytics.sendProperty("Tours.Enabled", tourIns.enabled.value);
    }

    toggleTools()
    {
        const toolIns = this.system.getMainComponent(CVToolProvider).ins;
        const viewerIns = this.system.getMainComponent(CVDocumentProvider).activeComponent.setup.viewer.ins;

        if (viewerIns.annotationsVisible.value) {
            viewerIns.annotationsVisible.setValue(false);
        }

        toolIns.visible.setValue(!toolIns.visible.value);
        this.analytics.sendProperty("Tools.Visible", toolIns.visible.value);
    }

    toggleMeasurement()
    {
        const tapeIns = this.system.getMainComponent(CVDocumentProvider).activeComponent.setup.tape.ins;

        tapeIns.visible.setValue(!tapeIns.visible.value);
    }
    
    enableAR()
    {
        const ARIns = this.system.getMainComponent(CVARManager).ins;

        ARIns.enabled.setValue(true);
        this.analytics.sendProperty("AR.enabled", true);
    }

    // Returns an array of objects with the article data for the current scene
    getArticles()
    {
        const reader = this.system.getMainComponent(CVDocumentProvider).activeComponent.setup.reader;
        const articles = reader.articles.map(entry => entry.article.data);

        return articles;
    }

    // Returns an array of objects with the annotation data for the current scene
    getAnnotations()
    {
        const scene = this.system.getComponent(CVScene);
        const views = scene.getGraphComponents(CVAnnotationView);
        let annotations = [];
        views.forEach(component => {
            annotations = annotations.concat(component.getAnnotations());
        });

        return annotations;
    }

    // Returns euler angles (yaw/pitch) for orbit navigation
    getCameraOrbit()
    {
        const orbitNavIns = this.system.getMainComponent(CVDocumentProvider).activeComponent.setup.navigation.ins;
        return orbitNavIns.orbit.value.slice(0,2);
    }

    // Sets euler angles (yaw/pitch) for orbit navigation
    setCameraOrbit( yaw: string, pitch: string)
    {
        const orbitNavIns = this.system.getMainComponent(CVDocumentProvider).activeComponent.setup.navigation.ins;
        const yawNum = parseFloat(yaw);
        const pitchNum = parseFloat(pitch);
  
        if (!isNaN(yawNum) && !isNaN(pitchNum)) { 
            orbitNavIns.orbit.setValue([yawNum, pitchNum, 0.0]);
        }
        else {
            console.log("Error: setCameraOrbit param is not a number.");
        }
    }

    // Returns camera offset vector (x,y,z)
    getCameraOffset()
    {
        const orbitNavIns = this.system.getMainComponent(CVDocumentProvider).activeComponent.setup.navigation.ins;
        return orbitNavIns.offset.value.slice(0,3);
    }

    // Sets camera offset vector (x,y,z)
    setCameraOffset( x: string, y: string, z: string)
    {
        const orbitNavIns = this.system.getMainComponent(CVDocumentProvider).activeComponent.setup.navigation.ins;
        let xNum = parseFloat(x);
        let yNum = parseFloat(y);
        let zNum = parseFloat(z);
  
        if (!isNaN(xNum) && !isNaN(yNum) && !isNaN(zNum)) {
            const minOffset = orbitNavIns.minOffset.value;
            const maxOffset = orbitNavIns.maxOffset.value;

            // check limits
            xNum = clamp(xNum, minOffset[0], maxOffset[0]);
            yNum = clamp(yNum, minOffset[1], maxOffset[1]);
            zNum = clamp(zNum, minOffset[2], maxOffset[2]);

            orbitNavIns.offset.setValue([xNum, yNum, zNum]);
        }
        else {
            console.log("Error: setCameraOffset param is not a number.");
        }
    }

    // Set background color
    setBackgroundColor(color0: string, color1?: string)
    {
        const backgroundIns = this.system.getMainComponent(CVDocumentProvider).activeComponent.setup.background.ins;

        const div = document.createElement('div');
        div.id = 'temp-color';
        document.getElementsByTagName("voyager-explorer")[0].appendChild(div);

        div.style.color = color0;
        if(div.style.color !== '') {
            const convColor0 = getComputedStyle(div).color;
            const colorArray0 = convColor0.split("(")[1].split(")")[0].split(",").map(component => parseInt(component)/255);
            backgroundIns.color0.setValue(colorArray0);
        }
        else {
            console.log("Error: Color0 param is invalid.");
        }

        if(color1) {
            div.style.color = color1;
            if(div.style.color !== '') {
                const convColor1 = getComputedStyle(div).color;
                const colorArray1 = convColor1.split("(")[1].split(")")[0].split(",").map(component => parseInt(component)/255);
                backgroundIns.color1.setValue(colorArray1);
            }
            else {
                console.log("Error: Color1 param is invalid.");
            }
        }

        document.getElementsByTagName("voyager-explorer")[0].removeChild(div);
    }

    // Set background style (Solid, LinearGradient, RadialGradient)
    setBackgroundStyle(style: string)
    {
        const backgroundIns = this.system.getMainComponent(CVDocumentProvider).activeComponent.setup.background.ins;

        const enumNames = Object.values(EBackgroundStyle).filter(value => typeof value === 'string') as string[];
        const foundStyle = enumNames.find(name => name.toLowerCase() === style.toLowerCase());

        if(foundStyle !== undefined) {
            backgroundIns.style.setValue(EBackgroundStyle[foundStyle]);
        }
        else {
            console.log("Error: Style param is invalid.");
        }
    }
}

window["VoyagerExplorer"] = ExplorerApplication;