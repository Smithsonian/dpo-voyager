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

import coreTypes, { lightTypes } from "./coreTypes";
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
import { EDerivativeQuality, IAnnotation } from "client/schema/model";
import CVARManager from "client/components/CVARManager";
import { EUIElements } from "client/components/CVInterface";
import { EBackgroundStyle } from "client/schema/setup";
import CRenderer from "client/../../libs/ff-scene/source/components/CRenderer";

import { clamp } from "client/utils/Helpers"
import CVScene from "client/components/CVScene";
import CVAnnotationView, { Annotation } from "client/components/CVAnnotationView";
import { ELanguageType, EUnitType } from "client/schema/common";
import { TranslateTransform, RotateTransform, ScaleTransform, SpecificResource, AnnotationBody } from "@iiif/3d-manifesto-dev";
import IIIFManifest from "client/io/IIIFManifestReader";
import { Matrix4, Vector3, Euler, Quaternion, DirectionalLight, PointLight, PlaneGeometry, Mesh, MeshBasicMaterial, MeshStandardMaterial, BufferGeometry, BufferAttribute, DoubleSide, Color } from "three";
import CScene from "@ff/scene/components/CScene";
import math from "@ff/three/math";
import CVModel2 from "client/components/CVModel2";
import CTransform from "@ff/scene/components/CTransform";
import NVNode from "client/nodes/NVNode";
import CVPointLight from "client/components/lights/CVPointLight";
import CVDirectionalLight from "client/components/lights/CVDirectionalLight";
import CVSpotLight from "client/components/lights/CVSpotLight";
import CLight from "@ff/scene/components/CLight";
import { EProjection } from "@ff/three/UniversalCamera";
import CPulse from "@ff/graph/components/CPulse";

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

const _mat4a = new Matrix4();
const _mat4b = new Matrix4();
const _vec3a = new Vector3();
const _vec3b = new Vector3();
const _euler = new Euler();
const _color = new Color();
const _upVector = new Vector3(0,1,0);

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

        this.documentProvider.activeComponent.setup.floor.dispose();
        this.documentProvider.activeComponent.setup.tape.dispose();
        this.documentProvider.activeComponent.setup.grid.dispose();
        
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
                if(data.type && data.type == "Manifest") {
                    this.loadIIIFManifest(JSON.stringify(data));
                }
                else {
                    merge = merge === undefined ? !data.lights && !data.cameras : merge;
                    return this.documentProvider.amendDocument(data, documentPath, merge);
                }
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
        const isDataURL = props.document && props.document.startsWith("data:");
        this.setBaseUrl(isDataURL ? "" : new URL(url || ".", window.location as any).href);

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
            props.document = isDataURL ? props.document : manager.getAssetName(props.document);
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
            props.texture = props.texture ? manager.getAssetName(props.texture) : null;
            props.occlusion = props.occlusion ? manager.getAssetName(props.occlusion) : null;
            props.normals = props.normals ? manager.getAssetName(props.normals) : null;

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

        // Make sure environment is properly initialized
        this.system.getMainComponent(CVDocumentProvider).activeComponent.setup.environment.ins.initialize.set();
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

    // load IIIF manifest
    protected loadIIIFManifest(data: any)
    {
        const models: CVModel2[] = [];
        console.log("LOADING IIIF MANIFEST");
        const activeDoc = this.documentProvider.activeComponent;
        const iiifManifest = new IIIFManifest(data);
        activeDoc.object3D.userData["IIIFManifest"] = iiifManifest;

        const cvScene = activeDoc.getInnerComponent(CVScene);
        const vScene = activeDoc.getComponent(CScene);
        const activeCamera = vScene.activeCamera;
        const setup = this.system.getMainComponent(CVDocumentProvider).activeComponent.setup;

        iiifManifest.loadManifest().then(() => {
        activeDoc.ins.title.setValue(iiifManifest.manifest.getLabel().getValue());
        const scenes = iiifManifest.scenes;
        scenes.forEach(scene => {
            const iiifModels = [];
            const iiifCameras = [];
            const iiifLights = [];
            const iiifComments = [];
            const iiifCanvases = [];

            const bgColor = scene.getBackgroundColor() as any;      
            if(bgColor) {
                this.setBackgroundStyle("solid");
                this.setBackgroundColor("rgb("+bgColor.red+","+bgColor.green+","+bgColor.blue+")");
            }

            const annos = iiifManifest.annotationsFromScene(scene);

            annos.forEach((anno) => {
                const obj = anno.getBody()[0];
                const body = obj.isSpecificResource() ? obj.getSource() : obj;
                
                const type = (body as any).getType();
                switch(type) {
                    case "model":
                        iiifModels.push(anno);
                        break;
                    case "perspectivecamera":
                    case "orthographiccamera":
                        iiifCameras.push(anno);
                        break;
                    case "directionallight":
                    case "spotlight":
                    case "pointlight":
                        iiifLights.push(anno);
                        break;
                    case "textualbody":
                        iiifComments.push(anno);
                        break;
                    case "canvas":
                        iiifCanvases.push(anno);
                        break;
                    default:
                        console.log("Unsupported IIIF annotation type: "+type);
                }
            });

            // handle models
            iiifModels.forEach((annotation) => {
                const model = annotation.getBody()[0];
                
                const newModel = activeDoc.appendModel(model.isSpecificResource() ? model.getSource()?.id : model.id);
                models.push(newModel);
                newModel.ins.localUnits.setValue(EUnitType.mm);
                newModel.object3D.userData["IIIFid"] = annotation.id;

                newModel.setFromMatrix(this.getIIIFBodyTransform(model,annotation));
            });

            // handle lights
            if(iiifLights.length > 0) {
                // clear default lights
                const lights = activeDoc.innerGraph.findNodeByName("Lights");
                const defaultLights = lights.getComponent(CTransform).children;
                while(defaultLights.length > 0) {
                    defaultLights[0].dispose();
                }

                iiifLights.forEach((light) => {
                    const lightBody = light.getBody()[0];
                    const lightLabel = lightBody.getLabel()?.getValue();
                    let newLight = null;
                    const lightNode = activeDoc.innerGraph.createCustomNode(NVNode);
                    lights.getComponent(CTransform).addChild(lightNode.transform);
                    
                    if(lightBody.isPointLight()) {  
                        newLight = lightNode.createComponent(CVPointLight);
                    }
                    else if(lightBody.isDirectionalLight()) {
                        newLight = lightNode.createComponent(CVDirectionalLight);
                    }
                    else if(lightBody.isSpotLight()) {
                        newLight = lightNode.createComponent(CVSpotLight);
                    }

                    if(newLight) {
                        // Set properties
                        lightNode.name = lightLabel ?? newLight.typeName;
                        (newLight as CLight).ins.intensity.setValue(lightBody.getIntensity());
                        const lightColor = lightBody.getColor().value;
                        (newLight as CLight).ins.color.setValue([lightColor[0]/255,lightColor[1]/255,lightColor[2]/255]);
                        newLight.object3D.userData["IIIFid"] = light.id;

                        // Handle transform
                        const transform = this.getIIIFBodyTransform(lightBody, light);
                        _vec3a.setFromMatrixPosition(transform);
                        newLight.transform.object3D.matrix.copy(transform);
                        const lookAtTransform = this.getIIIFLookAtTransform(lightBody, scene, _vec3a, _upVector);
                        if(lookAtTransform) {        
                            newLight.transform.object3D.matrix.multiply(lookAtTransform);
                        
                            // lookAt orients z-axis, so need to compensate for lights
                            newLight.transform.object3D.matrix.multiply(_mat4a.makeRotationX(90*math.DEG2RAD));
                        }
                        newLight.transform.setPropertiesFromMatrix();
                    }
                    else {
                        console.warn("Unhandled IIIF light type: "+lightBody.getType());
                    }
                });
            }

            // only handle one camera for now
            if(iiifCameras.length > 0) {
                const camera = iiifCameras[0];
                const vCamera = cvScene.cameras[0];
                const orbitNavIns = setup.navigation.ins;
                orbitNavIns.autoZoom.setValue(false);
                orbitNavIns.minOffset.setValue([-Infinity,-Infinity,-Infinity]);

                const cameraBody = camera.getBody()[0];

                // needs 'SelfOrSource' for labels
                //const cameraLabel = cameraBody.getPropertyFromSelfOrSource("label");
                //vCamera.node.name = cameraLabel ?? "Camera";

                _mat4b.copy(this.getIIIFBodyTransform(cameraBody, camera));

                _vec3a.setFromMatrixPosition(_mat4b);
                const transform = this.getIIIFLookAtTransform(cameraBody, scene, _vec3a, _upVector);

                _euler.setFromRotationMatrix(transform ? transform : _mat4b, "YXZ");
                _vec3b.setFromEuler(_euler).multiplyScalar(math.RAD2DEG);
                _vec3a.applyMatrix4(_mat4b.makeRotationFromEuler(_euler).invert());

                orbitNavIns.offset.setValue(_vec3a.toArray());
                orbitNavIns.orbit.setValue(_vec3b.toArray());

                // set properties if defined
                const fov = cameraBody.FieldOfView;
                if(fov) {
                    vCamera.ins.fov.setValue(fov);
                }
                const near = cameraBody.Near;
                const far = cameraBody.Far;
                if(near || far) {
                    vCamera.addIns.autoNearFar.setValue(false);
                    near ? vCamera.ins.near.setValue(near) : null;
                    far ? vCamera.ins.far.setValue(far) : null;
                }
                vCamera.ins.projection.setValue(cameraBody.isPerspectiveCamera() ? 
                    EProjection.Perspective : EProjection.Orthographic);

                vCamera.object3D.userData["IIIFid"] = camera.id;
            }

            // handle comments
            iiifComments.forEach((comment) => {
                const target = comment.getTarget();
                const commentBody = comment.getBody()[0];
                if(target.isSpecificResource) {
                    _vec3a.set(0,0,0);
                    const selector = (target as SpecificResource).getSelector();

                    const annotation = new Annotation(undefined);

                    const data = annotation.data;

                    // position
                    if (selector && selector.isPointSelector) {
                        const position = selector.Location;
                        data.position = [position.x, position.y, position.z];
                        _vec3a.fromArray(data.position);
                    }

                    // direction
                    const endPosition = commentBody.Position;
                    if(endPosition) {
                        const labelSelector = (endPosition as SpecificResource).getSelector();
                        const labelPos = labelSelector.Location;
                        _vec3b.set(labelPos.x, labelPos.y, labelPos.z);
                        const labelDir = _vec3b.sub(_vec3a);
                        data.direction = labelDir.toArray();
                        data.scale = labelDir.length();
                    }
                    else {
                        models[0].localBoundingBox.getCenter(_vec3b);
                        data.direction = _vec3a.sub(_vec3b).toArray();
                        data.scale = 0.001;
                    }

                    // additional attributes
                    annotation.title = commentBody.Value;                  

                    const view = models[0].getGraphComponent(CVAnnotationView);
                    view.addAnnotation(annotation);
                }
            });
            setup.viewer.ins.annotationsVisible.setValue(iiifComments.length > 0);

            // handle canvases
            iiifCanvases.forEach((canvas) => {
                const target = canvas.getTarget();
                if(target.isSpecificResource) {
                    const selector = (target as SpecificResource).__jsonld.selector[0];
                    
                    if(selector.type === "PolygonZSelector") {
                        const polygon = selector.value;
                        const startIdx = polygon.lastIndexOf("(") + 1;
                        const values = polygon.slice(startIdx, polygon.indexOf(")"));
                        const valueArray = values.split(" ");
                        const corners : Vector3[] = [];
                        for(let i=0; i<valueArray.length; i+=3) {
                            corners.push(new Vector3(parseFloat(valueArray[i]), parseFloat(valueArray[i+1]), parseFloat(valueArray[i+2])));
                        }

                        const geometry = new BufferGeometry().setFromPoints(corners);
                        geometry.setIndex([0, 1, 2, 2, 3, 0]);
                        geometry.setAttribute( 'uv', new BufferAttribute( new Float32Array( [0,1,0,0,1,0,1,1] ), 2 ) );
                        geometry.computeVertexNormals();

                        // load image
                        const canvasId = canvas.getBody()[0].id;
                        const canvasObj = iiifManifest.manifest?.getSequences()[0]?.getCanvasById(canvasId);
                        const uri = canvasObj.getCanonicalImageUri();
                        const bgColor = canvasObj.getProperty("backgroundColor");
                        
                        this.assetReader.getTexture(uri).then(map => {
                            const canvasMesh = new Mesh(
                                geometry,
                                new MeshStandardMaterial({map: map, side: DoubleSide})
                            );
                            cvScene.object3D.add(canvasMesh);

                            if(bgColor) {
                                _color.set(bgColor);
                                canvasMesh.material.onBeforeCompile = (shader) => {
                                    shader.fragmentShader = shader.fragmentShader.slice(0,shader.fragmentShader.lastIndexOf('}')).concat(
                                        '\n \
                                        if (!gl_FrontFacing) {\n \
                                            gl_FragColor = vec4('
                                        + _color.toArray().toString() + 
                                        ', 1.0);\n \
                                        }\n \
                                        }'
                                    )
                                }
                            }
                        });
                    }
                }
            });
        });
        });
        
        setup.ins.saveState.set();
    }

    private getIIIFBodyTransform(body: any, annotation: any) : Matrix4
    {
        _mat4a.identity();
        if (body.isSpecificResource()) {
            const transforms = (body as SpecificResource).getTransform() || [];

            transforms.forEach((transform) => {
                _mat4b.identity();
                if(transform.isTranslateTransform) {
                    const translation = (transform as TranslateTransform).getTranslation() as any;
                    if (translation) {
                        _vec3a.set(translation.x,translation.y,translation.z);
                        _mat4b.setPosition(_vec3a);
                    }
                }
                else if (transform.isRotateTransform) {
                    const rotation = (transform as RotateTransform).getRotation() as any;
                    _euler.set(rotation.x*math.DEG2RAD,rotation.y*math.DEG2RAD,rotation.z*math.DEG2RAD, "XYZ");
                    _mat4b.makeRotationFromEuler(_euler);
                }
                else if(transform.isScaleTransform) {
                    const scale = (transform as ScaleTransform).getScale() as any;
                    _mat4b.makeScale(scale.x,scale.y,scale.z);
                }
                _mat4a.premultiply(_mat4b);
            });                        
        }

        const target = annotation.getTarget();
        if(target && target.isSpecificResource) {
            const selector = target.getSelector();
            if(selector && selector.isPointSelector) {
                _mat4b.identity();
                _mat4b.setPosition(selector.Location.x, selector.Location.y, selector.Location.z);
                _mat4a.premultiply(_mat4b);
            }
        }

        return _mat4a;
    }

    private getIIIFLookAtTransform(body: any, scene: any, eye: Vector3, up: Vector3) : Matrix4
    {
        _mat4a.identity();
        if (body.LookAt?.isPointSelector) {
            const lookAt = body.LookAt?.Location;

            _mat4a.lookAt(eye,lookAt,up);
            return _mat4a;
        }
        else if(body.LookAt?.id) {
            const anno = scene.getAnnotationById(body.LookAt.id);
            _vec3b.set(anno.LookAtLocation.x,anno.LookAtLocation.y,anno.LookAtLocation.z);

            _mat4a.lookAt(eye,_vec3b,up);
            return _mat4a;
        }
        return null;
    }
}

window["VoyagerExplorer"] = ExplorerApplication;