/**
 * 3D Foundation Project
 * Copyright 2025 Smithsonian Institution
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
import { ELanguageType } from "client/schema/common";

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
    /** Enables/disables pointer-driven camera controls. */
    controls?: string;
    /** Enables/disables navigation interaction prompt. */
    prompt?: string;
    /** Enables/disables reader top-level visibility. */
    reader?: string;
    /** ISO 639-1 language code to change active component language */
    lang?: string;
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
(c) 2025 Smithsonian Institution

https://3d.si.edu
https://github.com/smithsonian/dpo-voyager

-----------------------------------------------------
Version: ${ENV_VERSION}
-----------------------------------------------------
    `;

    readonly props: IExplorerApplicationProps;
    readonly system: System;

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
        // TODO: More complete clean up that doesn't interfere with component disconnect
        this.assetReader.dispose();
        this.documentProvider.activeComponent.clearNodeTree();
        this.system.getMainComponent(CRenderer).views.forEach(view => view.dispose());
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

    reloadDocument()
    {
        const oldDocument = this.documentProvider.activeComponent;
        this.documentProvider.createDocument(documentTemplate as any);
        this.evaluateProps();
        oldDocument?.dispose();
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
        const props = {...this.props};
        const manager = this.assetManager;
        const qs = new URL(window.location.href).searchParams;
        props.root = props.root || qs.get("root") || qs.get("r");
        props.dracoRoot = props.dracoRoot || qs.get("dracoRoot") || qs.get("dr");
        props.resourceRoot = props.resourceRoot || qs.get("resourceRoot") || qs.get("rr");
        props.document = props.document || qs.get("document") || qs.get("d");
        props.model = props.model || qs.get("model") || qs.get("m");
        props.geometry = props.geometry || qs.get("geometry") || qs.get("g");
        props.texture = props.texture || qs.get("texture") || qs.get("t");
        props.occlusion = props.occlusion || qs.get("occlusion") || qs.get("o");
        props.normals = props.normals || qs.get("normals") || qs.get("n");
        props.quality = props.quality || qs.get("quality") || qs.get("q");
        props.uiMode = props.uiMode || qs.get("uiMode") || qs.get("u");
        props.bgColor = props.bgColor || qs.get("bgColor") || qs.get("bc");
        props.bgStyle = props.bgStyle || qs.get("bgStyle") || qs.get("bs");
        props.controls = props.controls || qs.get("controls") || qs.get("ct");
        props.prompt = props.prompt || qs.get("prompt") || qs.get("pm");
        props.reader = props.reader || qs.get("reader") || qs.get("rdr");
        props.lang = props.lang || qs.get("lang") || qs.get("l");

        const url = props.root || props.document || props.model || props.geometry;
        this.setBaseUrl(new URL(url || ".", window.location as any).href);

        // Config custom UI layout
        if (props.uiMode) {
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

        if(props.lang) {
            this.setLanguage(props.lang);
        }

        if (props.document) {
            // first loading priority: document
            props.document = manager.getAssetName(props.document);
            this.loadDocument(props.document, undefined, props.quality)
            .then(() => this.postLoadHandler(props))
            .catch(error => Notification.show(`Failed to load document: ${error.message}`, "error"));
        }
        else if (props.model) {
            // second loading priority: model
            props.model = manager.getAssetName(props.model);

            this.assetReader.getText(props.model)       // make sure we have a valid model path
            .then(() => {
                this.loadModel(props.model, props.quality);
                this.postLoadHandler(props);
            })
            .catch(error => Notification.show(`Bad Model Path: ${error.message}`, "error"));
        }
        else if (props.geometry) {
            // third loading priority: geometry (plus optional color texture)
            props.geometry = manager.getAssetName(props.geometry);
            props.texture = manager.getAssetName(props.texture);
            props.occlusion = manager.getAssetName(props.occlusion);
            props.normals = manager.getAssetName(props.normals);

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
        if(props.controls) {
            this.enableNavigation(props.controls);
        }
        if(props.prompt) {
            this.enablePrompt(props.prompt);
        }
        if(props.reader) {
            this.enableReader(props.reader);
        }
        if(props.lang) {
            this.setLanguage(props.lang);
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
        this.analytics.sendProperty("Annotations_Visible", viewerIns.annotationsVisible.value);
    }

    toggleReader()
    {
        const reader = this.system.getMainComponent(CVDocumentProvider).activeComponent.setup.reader;
        const readerIns = reader.ins;
                    
        readerIns.enabled.setValue(!readerIns.enabled.value);
        readerIns.focus.setValue(readerIns.enabled.value);

        if(readerIns.enabled.value) {
            readerIns.articleId.setValue(reader.articles.length === 1 ? reader.articles[0].article.id : "");
        }

        this.analytics.sendProperty("Reader_Enabled", readerIns.enabled.value);
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

        this.analytics.sendProperty("Tours_Enabled", tourIns.enabled.value);
    }

    toggleTools()
    {
        const toolIns = this.system.getMainComponent(CVToolProvider).ins;
        const viewerIns = this.system.getMainComponent(CVDocumentProvider).activeComponent.setup.viewer.ins;

        if (viewerIns.annotationsVisible.value) {
            viewerIns.annotationsVisible.setValue(false);
        }

        toolIns.visible.setValue(!toolIns.visible.value);
        this.analytics.sendProperty("Tools_Visible", toolIns.visible.value);
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
        this.analytics.sendProperty("AR_enabled", true);
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
    getCameraOrbit( type?: string )
    {
        const orbitNavIns = this.system.getMainComponent(CVDocumentProvider).activeComponent.setup.navigation.ins;
        let returnValue = orbitNavIns.orbit.value;
        if(type) {
            const type_lower = type.toLowerCase();
            if(type_lower === "max") {
                returnValue = orbitNavIns.maxOrbit.value;
            }
            else if(type_lower === "min") {
                returnValue = orbitNavIns.minOrbit.value;
            }
            else if(type_lower !== "active") {
                console.error("Error: getCameraOrbit invalid type param.");
                return;
            }
        }
        return returnValue.slice(0,2);
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
            console.error("Error: setCameraOrbit param is not a number.");
        }
    }

    // Returns camera offset vector (x,y,z)
    getCameraOffset( type?: string )
    {
        const orbitNavIns = this.system.getMainComponent(CVDocumentProvider).activeComponent.setup.navigation.ins;
        let returnValue = orbitNavIns.offset.value;
        if(type) {
            const type_lower = type.toLowerCase();
            if(type_lower === "max") {
                returnValue = orbitNavIns.maxOffset.value;
            }
            else if(type_lower === "min") {
                returnValue = orbitNavIns.minOffset.value;
            }
            else if(type_lower !== "active") {
                console.error("Error: getCameraOffset invalid type param.");
                return;
            }
        }
        return returnValue.slice(0,3);
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
            console.error("Error: setCameraOffset param is not a number.");
        }
    }

    // Set background color
    setBackgroundColor(color0: string, color1?: string)
    {
        const backgroundIns = this.system.getMainComponent(CVDocumentProvider).activeComponent.setup.background.ins;

        const div = document.createElement('div');
        div.id = 'temp-color';
        div.style.color = color0;
        document.body.appendChild(div);
    
        if(div.style.color !== '') {
            const convColor0 = getComputedStyle(div).color;
            const colorArray0 = convColor0.split("(")[1].split(")")[0].split(",").map(component => parseInt(component)/255);
            backgroundIns.color0.setValue(colorArray0);
        }
        else {
            console.error("Error: Color0 param is invalid.");
        }

        if(color1) {
            div.style.color = color1;
            if(div.style.color !== '') {
                const convColor1 = getComputedStyle(div).color;
                const colorArray1 = convColor1.split("(")[1].split(")")[0].split(",").map(component => parseInt(component)/255);
                backgroundIns.color1.setValue(colorArray1);
            }
            else {
                console.error("Error: Color1 param is invalid.");
            }
        }

        document.body.removeChild(div);
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
            console.error("Error: Style param is invalid.");
        }
    }

    // Activate a specific tour step
    setTourStep(tourIdx: string, stepIdx: string, interpolate: boolean)
    {
        const tourIns = this.system.getMainComponent(CVDocumentProvider).activeComponent.setup.tours.ins;
        const tourOuts = this.system.getMainComponent(CVDocumentProvider).activeComponent.setup.tours.outs;
        let tour = parseInt(tourIdx);
        let step = parseInt(stepIdx);
  
        if (!isNaN(tour) && !isNaN(step) && tour >= 0 && step >= 0) {
            tourIns.tourIndex.setValue(tour);

            if(interpolate) {
                tourOuts.stepIndex.setValue(step-1);
                tourIns.next.set();
            }
            else {
                tourIns.stepIndex.setValue(step);
            }
        }
        else {
            console.error("Error: setTourStep param ["+tour+" "+step+"] is not a valid number.");
        }
    }

    // enable/disable camera controls
    enableNavigation(enable: string)
    {
        const controls = this.isTrue(enable);

        if(controls != undefined) {
            const orbitNavIns = this.system.getMainComponent(CVDocumentProvider).activeComponent.setup.navigation.ins;
            orbitNavIns.pointerEnabled.setValue(controls);
        }
        else {
            console.error("Error: enableNavigation param is not valid.");
        }
    }

    // enable/disable navigations prompt
    enablePrompt(enable: string)
    {
        const prompt = this.isTrue(enable);

        if(prompt != undefined) {
            const orbitNavIns = this.system.getMainComponent(CVDocumentProvider).activeComponent.setup.navigation.ins;
            orbitNavIns.promptEnabled.setValue(prompt);
        }
        else {
            console.error("Error: enablePrompt param is not valid.");
        }
    }

    // enable/disable reader visibility
    enableReader(enable: string)
    {
        const enabled = this.isTrue(enable);

        if(enabled != undefined) {
            const readerIns = this.system.getMainComponent(CVDocumentProvider).activeComponent.setup.reader.ins;
            readerIns.visible.setValue(enabled);
        }
        else {
            console.error("Error: enableReader param is not valid.");
        }
    }

    // set language
    setLanguage(languageID: string)
    {
        const languageIns = this.system.getMainComponent(CVDocumentProvider).activeComponent.setup.language.ins;
        const id = languageID.toUpperCase();

        if(id in ELanguageType) {
            languageIns.activeLanguage.setValue(ELanguageType[id]);
        }
        else {
            console.error("Error: setLanguage param is not a valid language id.");
        }
    }

    // set the active article
    setActiveArticle(id: string)
    {
        const reader = this.system.getMainComponent(CVDocumentProvider).activeComponent.setup.reader;
        reader.ins.enabled.setValue(true);
        reader.ins.articleId.setValue(id);
    }

    // helper function to standardize parsing boolean string params
    protected isTrue(input: string)
    {
        let output = undefined;
        const outputLower = input.toLowerCase();
        if(outputLower === "true") {
            output = true;
        }
        else if(outputLower === "false") {
            output = false;
        }
        return output;
    }
}

window["VoyagerExplorer"] = ExplorerApplication;