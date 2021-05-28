/**
 * 3D Foundation Project
 * Copyright 2020 Smithsonian Institution
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
 * 
 * 
 * The following is heavily adapted from the great AR work by the <model-viewer> team:
 * Copyright 2019 Google LLC. All Rights Reserved.
 * https://github.com/google/model-viewer/blob/master/packages/model-viewer/src/three-components/ARRenderer.ts
 */

import Component, { types } from "@ff/graph/Component";
import CRenderer from "@ff/scene/components/CRenderer";
import CTransform from "@ff/scene/components/CTransform";
import CScene from "@ff/scene/components/CScene";
import RenderView from "@ff/scene/RenderView";
import UniversalCamera from "@ff/three/UniversalCamera";
import CPulse from "@ff/graph/components/CPulse";

import {Matrix4, Vector3, Ray, Raycaster, Mesh, Object3D, PlaneBufferGeometry, MeshBasicMaterial, ArrayCamera, Material, 
    PerspectiveCamera, Shape, ShapeBufferGeometry, DoubleSide, WebGLRenderer, Box3, Quaternion} from 'three';

//import * as WebXR from "../types/WebXR";
import {IS_ANDROID, IS_AR_QUICKLOOK_CANDIDATE, IS_IOS, /*IS_IOS_CHROME, IS_IOS_SAFARI,*/ IS_WEBXR_AR_CANDIDATE, IS_MOBILE} from '../constants';
import CVScene from "./CVScene";
import CVSetup from "./CVSetup";
import { EUnitType } from "client/schema/common";
import { EDerivativeUsage, EDerivativeQuality, EAssetType } from "client/models/Derivative";
import CVModel2 from "./CVModel2";
import CVAssetManager from "./CVAssetManager";
import CVAnnotationView from "./CVAnnotationView";

import { Shadow } from "../xr/XRShadow"
import CVDirectionalLight from "./CVDirectionalLight";
import { EShaderMode } from "client/schema/setup";
import CVAnalytics from "./CVAnalytics";

////////////////////////////////////////////////////////////////////////////////

const _matrix4 = new Matrix4();
const _vector3 = new Vector3();
//const _vector3b = new Vector3();
const _hitPosition = new Vector3();
const _boundingBox = new Box3();
const _quat = new Quaternion();
const ROTATION_RATE = 1.5;
const ANNOTATION_SCALE = 2.0;

export default class CVARManager extends Component
{
    static readonly typeName: string = "CVARManager";

    static readonly text: string = "ARManager";
    static readonly icon: string = "";

    static readonly isSystemSingleton = true;

    private _shadowRoot = null;

    protected static readonly ins = {
        enabled: types.Boolean("State.Enabled")
    };

    protected static readonly outs = {
        enabled: types.Boolean("State.Enabled"),
        available: types.Boolean("State.Available", IS_MOBILE),
        isPlaced: types.Boolean("AR.Placed", false),
        isPresenting: types.Boolean("AR.Presenting", false)
    };
    
    ins = this.addInputs(CVARManager.ins);
    outs = this.addOutputs(CVARManager.outs);

    protected get renderer() {
        return this.getMainComponent(CRenderer);
    }
    protected get pulse() {
        return this.getMainComponent(CPulse);
    }
    protected get sceneNode() {
        return this.getSystemComponent(CVScene);
    }
    protected get analytics() {
        return this.system.getMainComponent(CVAnalytics);
    }
    protected get assetManager() {
        return this.getMainComponent(CVAssetManager);
    }

    get shadowRoot() {
        return this._shadowRoot;
    }
    set shadowRoot(root: ShadowRoot) {
        this._shadowRoot = root;
    }

    protected arLink = document.createElement('a');
    protected raycaster: Raycaster = new Raycaster();

    protected initialHitTestSource: XRHitTestSource = null;
    protected inputSource: XRInputSource = null;
    protected transientHitTestSource: XRTransientInputHitTestSource = null;
    protected refSpace: XRReferenceSpace = null;
    protected frame: XRFrame = null;
    protected vScene: CScene = null;
    protected camera: UniversalCamera = null;
    protected cameraParent: Object3D = null;
    protected cachedView: RenderView = null;
    protected cachedQuality: EDerivativeQuality = null;
    protected cachedNearPlane: number = 0.0;
    protected xrCamera: PerspectiveCamera = null;
    protected hitPlane: Mesh = null;
    protected selectionRing: Mesh = null;
    protected session: XRSession = null;
    protected setup: CVSetup = null;
    protected originalUnits: EUnitType = null;
    protected isTranslating: boolean = false;
    protected isRotating: boolean = false;
    protected isScaling: boolean = false;
    protected lastDragValueX: number = 0.0;
    protected lastDragValueY: number = 0.0;
    protected totalDrag: number = 0;
    protected lastScale: number = 0.0;
    protected lastHitPosition: Vector3 = new Vector3();
    protected lastFrameTime: number = 0;
    protected targetOpacity: number = 0.0;
    protected modelFloorOffset: number = 0.0;
    protected optimalCameraDistance: number = 0.0;
    protected shadow: Shadow = null;
    protected lightTransform: CTransform = null;
    protected lightsToReset: CVDirectionalLight[] = [];
    protected featuresToReset: number[] = [];  // in order: floor/grid/tape/slicer/material

    update()
    {
        const { ins, outs } = this;

        if (ins.enabled.changed) {
            let isEnabled = ins.enabled.value;
            
            if (isEnabled) {
                if(IS_WEBXR_AR_CANDIDATE) { 
                    this.launchWebXR();
                    this.analytics.sendProperty("AR.Enabled", "WebXR");
                }
                else if(IS_ANDROID) {
                    this.launchSceneViewer();
                    this.analytics.sendProperty("AR.Enabled", "SceneViewer");
                }
                else if(IS_IOS && IS_AR_QUICKLOOK_CANDIDATE) {
                    this.launchQuickLook();
                    this.analytics.sendProperty("AR.Enabled", "QuickLook");
                }
                else {
                    isEnabled = false;
                    this.analytics.sendProperty("AR.Enabled", "Unavailable");
                }
            }

            outs.enabled.setValue(isEnabled);
        }

        return true;
    }

    protected launchWebXR() {
        const renderer = this.renderer.views[0].renderer;
        const sceneComponent = this.vScene = this.renderer.activeSceneComponent;
        const camera = this.camera = sceneComponent.activeCamera;
        this.cameraParent = camera.parent; console.log(this);
        const setup = this.setup = this.getSystemComponent(CVSetup); //this.documentProvider.outs.activeDocument.value.setup;
        
        if(!setup) {
            return false;
        }

        const models = this.sceneNode.getGraphComponents(CVModel2);
        const derivative = models[0] ?  models[0].derivatives.get(EDerivativeUsage.Web3D, EDerivativeQuality.AR) : null;

        if(derivative) {
            this.setup.navigation.setChanged(true);  // set changed var to disable autoZoom for bounds changes

            this.cachedQuality = models[0].ins.quality.value;  

            models.forEach(model => {
                model.ins.quality.setValue(EDerivativeQuality.AR);
            });

            renderer.setAnimationLoop( (time, frame) => this.render(time, frame) );

            navigator.xr.requestSession( 'immersive-ar', {
                requiredFeatures: ['hit-test'],
                optionalFeatures: ['dom-overlay'],
                domOverlay:
                    {root: this.shadowRoot.querySelector('ff-viewport-overlay')}
            } ).then( session => this.onSessionStarted(renderer, session) ); //.catch(reason => { console.log("Error starting session: " + reason); }); **TODO
        }
    }

    protected async onSessionStarted( renderer: WebGLRenderer, session: XRSession ) { 
        const gl = this.renderer.views[0].renderer.getContext();
        await gl.makeXRCompatible();
    
        session.updateRenderState(
            {baseLayer: new XRWebGLLayer(session, gl, {alpha: true})}
        );
        
        this.setupScene();

        renderer.xr.enabled = true;
        renderer.xr.setReferenceSpaceType( 'local' );
        renderer.xr.setSession( session as THREE.XRSession ); 
    
        session.addEventListener( 'end', this.onSessionEnded ); 

        this.refSpace = await session.requestReferenceSpace('local');
        const viewerRefSpace = await session.requestReferenceSpace('viewer');

        // Do an initial hit test (model-viewer suggested 20 deg down)
        const radians = 20 * Math.PI / 180; 
        const ray = new XRRay(
            new DOMPoint(0, 0, 0),
            {x: 0, y: -Math.sin(radians), z: -Math.cos(radians)});
        session.requestHitTestSource({space: viewerRefSpace!, offsetRay: ray})
            .then(hitTestSource => {
                this.initialHitTestSource = hitTestSource;
            });

        this.outs.isPresenting.setValue(true);
            
        this.session = session;
        this.lastFrameTime = performance.now();

        this.setup.reader.ins.enabled.on("value", this.endSession, this);
    }

    protected endSession() {
        if(this.session) {
            this.session.end();
        }
    }

    protected onSessionEnded = () => {
        this.outs.isPresenting.setValue(false);

        const renderer = this.renderer.views[0].renderer;

        this.resetScene();
        
        // Clean up
        const hitSourceInitial = this.initialHitTestSource;
        if (hitSourceInitial != null) {
            hitSourceInitial.cancel();
            this.initialHitTestSource = null;
        }

        const hitSource = this.transientHitTestSource;
        if (hitSource != null) {
            hitSource.cancel();
            this.transientHitTestSource = null;
        }
      
        this.refSpace = null;
        this.frame = null;
        this.inputSource = null;
        this.xrCamera = null;
        this.cachedView = null;
        
        const session = this.session;
        if(session) {
            session.removeEventListener( 'end', this.onSessionEnded );
            session.removeEventListener('selectstart', this.onSelectStart);
            session.removeEventListener('selectend', this.onSelectEnd);
            this.session = null; 
        }

        this.setup.reader.ins.enabled.off("value", this.endSession, this);

        renderer.setAnimationLoop(null);
        renderer.xr.enabled = false;
        this.outs.isPlaced.setValue(false);

        this.setup.navigation.ins.enabled.setValue(true);

        //this.pulse.start();
     
        this.renderer.views[0].render();
    }

    protected setupScene() {
        const { cameraParent, setup, featuresToReset } = this;
        const scene = this.sceneNode;
        
        if(cameraParent) {
            cameraParent.remove(this.camera);
        } 

        this.setup.background.hide();

        // Disable navigation so we don't get duplicate events with dom overlay
        //this.pulse.stop();
        this.setup.navigation.ins.enabled.setValue(false);

        // Reset lights moved by navigation
        const lightNode = scene.graph.findNodeByName("Lights");
        const lightTransform = this.lightTransform = lightNode.getComponent(CTransform, true);
        lightTransform.ins.rotation.reset();

        // Cache extended feature values
        featuresToReset.push(setup.floor.ins.visible.value ? 1 : 0);
        featuresToReset.push(setup.grid.ins.visible.value ? 1 : 0);
        featuresToReset.push(setup.tape.ins.visible.value ? 1 : 0);
        featuresToReset.push(setup.slicer.ins.enabled.value ? 1 : 0);
        featuresToReset.push(setup.viewer.ins.shader.value);
        
        // Disable extended features (TODO: support some/all of these features)    
        setup.floor.ins.visible.setValue(false);
        setup.grid.ins.visible.setValue(false);
        setup.tape.ins.visible.setValue(false);
        setup.slicer.ins.enabled.setValue(false);
        if(setup.viewer.ins.shader.value !== EShaderMode.Default) {
            setup.viewer.ins.shader.setValue(EShaderMode.Default);
        }

        // Set scale to m
        const originalUnits = this.originalUnits = scene.ins.units.getValidatedValue();
        if(originalUnits != EUnitType.m) {
            this.sceneNode.ins.units.setValue(EUnitType.m);
        }

        // Temporary until annotation scale implementation is resolved
        const views = scene.getGraphComponents(CVAnnotationView);
        views.forEach(component => {
            component.setXRScale(ANNOTATION_SCALE);
        });

        // Disable any shadow casting lights
        const lights = scene.getGraphComponents(CVDirectionalLight);
        lights.forEach(light => {
            if(light.ins.shadowEnabled.value) {
                light.ins.shadowEnabled.setValue(false);
                this.lightsToReset.push(light);
            }
        });

        // Setup shadow
        this.pulse.pulse(Date.now());  
        scene.update(null);  // force bounding box update so shadow is correct size
        const shadow = this.shadow = new Shadow(this.sceneNode, this.vScene.scene, 0.5);
        shadow.setIntensity(0.3);

        // Cache bounding box for placement
        _boundingBox.copy(this.sceneNode.outs.boundingBox.value);

        // Compute optimal camera distance for initial placement
        _boundingBox.getSize(_vector3);
        /*_boundingBox.getCenter(_vector3b);
        const size = Math.max(_vector3.x / this.camera.aspect, _vector3.y);
        const fovFactor = 1 / (2 * Math.tan(this.camera.fov * (180/Math.PI) * 0.5));
        this.optimalCameraDistance = (_vector3b.z + size * fovFactor + _vector3.z * 0.75);*/

        this.cachedNearPlane = this.camera.near;
        if(Math.max(_vector3.x, _vector3.y, _vector3.z) < 0.5) {
            this.camera.near = 0.01;
        }
    }

    protected resetScene() {
        const {camera, cameraParent, setup, featuresToReset} = this;
        const scene = this.vScene.scene;

        // Reset component camera view
        if(cameraParent) {
            cameraParent.add(camera);
        }      
        camera.position.set(0, 0, 0);
        camera.rotation.set(0, 0, 0);
        camera.near = this.cachedNearPlane;
        camera.updateMatrix(); 

        // reset lights
        this.lightTransform.object3D.rotation.set(0,0,0);
        this.lightTransform.object3D.updateMatrix(); 
        
        // Reset scene and update graph
        this.sceneNode.ins.units.setValue(this.originalUnits);
        scene.position.setScalar(0);
        scene.rotation.y = 0;
        scene.scale.setScalar(1); 
        scene.updateMatrix();
        scene.updateMatrixWorld(true);
        
        // Reset cached extended feature values
        featuresToReset.reverse();
        setup.floor.ins.visible.setValue(!!featuresToReset.pop());
        setup.grid.ins.visible.setValue(!!featuresToReset.pop());
        setup.tape.ins.visible.setValue(!!featuresToReset.pop());
        setup.slicer.ins.enabled.setValue(!!featuresToReset.pop());
        const cachedShader = featuresToReset.pop();
        if(cachedShader !== EShaderMode.Default) {
            setup.viewer.ins.shader.setValue(cachedShader);
        }

        // Temporary until annotation scale implementation is resolved
        const views = this.sceneNode.getGraphComponents(CVAnnotationView);
        views.forEach(component => {
            component.setXRScale(1.0);
        });

        // Reset shadowing lights
        this.lightsToReset.forEach(light => {
            light.ins.shadowEnabled.setValue(true);
        });
        this.lightsToReset.length = 0;
        
        setup.background.show();

        // Reset quality
        const models = this.sceneNode.getGraphComponents(CVModel2);
        models.forEach(model => {
            model.ins.quality.setValue(this.cachedQuality);
        });
        
        // Clean up
        const hitPlane = this.hitPlane;
        if (hitPlane != null) {
            scene.remove(hitPlane);
            hitPlane!.geometry.dispose();
            (hitPlane!.material as Material).dispose();
            this.hitPlane = null;
        }

        const selectionRing = this.selectionRing;
        if (selectionRing != null) {
            scene.remove(selectionRing);
            selectionRing!.geometry.dispose();
            (selectionRing!.material as Material).dispose();
            this.selectionRing = null;
        }
     
        const shadow = this.shadow;
        if (shadow != null) {
            scene.remove(shadow);
            shadow.dispose();
            this.shadow = null;
        } 

        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
    }

    protected render = (timestamp, frame) => {
        this.frame = frame;
        const renderer = this.renderer.views[0].renderer;
        const {camera, xrCamera} = this;

        if(!frame || !frame.getViewerPose(this.refSpace!)) {
            return;
        }

        // Get xr camera from Three.js to set local camera properties. TODO: More efficient use of xrcamera
        if(!xrCamera && this.session) {
            const xrCameraArray : ArrayCamera = renderer.xr.getCamera(this.camera) as ArrayCamera;
            this.xrCamera = xrCameraArray.cameras[0];
            return;
        }
        else if(xrCamera) {
            camera.position.setFromMatrixPosition(xrCamera.matrixWorld); 
            xrCamera.projectionMatrixInverse.copy(xrCamera.projectionMatrix).invert();

            camera.projectionMatrix.fromArray(xrCamera.projectionMatrix.elements);
            camera.projectionMatrixInverse.copy(xrCamera.projectionMatrix).invert();
        }
  
        // center model in front of camera while trying for initial placement
        if (this.initialHitTestSource != null && xrCamera) {
            const scene = this.vScene.scene; 
            const {position} = scene; 
            const radius =  this.sceneNode.outs.boundingRadius.value * 2.0 + xrCamera.near; // Math.abs(this.optimalCameraDistance);

            const e = xrCamera.matrixWorld.elements;
			position.set(-e[ 8 ], -e[ 9 ], -e[ 10 ]).normalize(); 
            position.multiplyScalar(radius);
            position.add(camera.position); 
            _boundingBox.getCenter(_vector3);
            position.add(_vector3.negate());
            scene.updateMatrix();
            scene.updateMatrixWorld();

            //this.updateBoundingBox();
        }

        this.setInitialPosition(frame);

        this.handleInput(frame);

        if(this.outs.isPlaced.value) {
            // update selection ring opacity
            const deltaT = timestamp - this.lastFrameTime; 
            this.updateOpacity(deltaT, this.targetOpacity);
            this.lastFrameTime = timestamp;
        }

        // TODO: Temporary fix for Chrome depth bug
        // https://bugs.chromium.org/p/chromium/issues/detail?id=1184085
        const gl = renderer.getContext();
        gl.depthMask(false);
        gl.clear(gl.DEPTH_BUFFER_BIT);
        gl.depthMask(true);
        
        renderer.render( this.vScene.scene, this.camera );
    }

    // adapted from model-viewer
    protected setInitialPosition( frame: XRFrame ) {
        const hitSource = this.initialHitTestSource;
        if (hitSource == null) {
        return;
        }

        const hitTestResults = frame.getHitTestResults(hitSource);
        if (hitTestResults.length == 0) {
        return;
        }

        const hit = hitTestResults[0];
        const hitPt = this.getHitPoint(hit);
        if (hitPt == null) {
        return;
        }

        this.placeModel(hitPt);

        hitSource.cancel();
        this.initialHitTestSource = null;

        const {session} = frame;
        session.addEventListener('selectstart', this.onSelectStart);
        session.addEventListener('selectend', this.onSelectEnd);
        session.requestHitTestSourceForTransientInput({profile: 'generic-touchscreen'})
            .then(hitTestSource => {
                this.transientHitTestSource = hitTestSource; 
            });
    }

    protected getHitPoint( hitResult: XRHitTestResult): THREE.Vector3|null {
        const pose = hitResult.getPose(this.refSpace!);
        if (pose == null) {
          return null;
        }

        const hitMatrix = _matrix4.fromArray(pose.transform.matrix);
        // Check that the y-coordinate of the normal is large enough that the normal
        // is pointing up.
        return hitMatrix.elements[5] > 0.75 ?
            _hitPosition.setFromMatrixPosition(hitMatrix) :
            null;
    }

    protected onSelectStart = (event: Event) => {
        if (ENV_DEVELOPMENT) {
            //console.log("WebXR Select Start");
        }

        const scene = this.vScene.scene!;
        
        const hitSource = this.transientHitTestSource;
        if (hitSource == null) {
            return;
        }

        this.targetOpacity = 0.5;

        const fingers = this.frame!.getHitTestResultsForTransientInput(hitSource);
     
        if (fingers.length === 1) { 

            this.inputSource = (event as XRInputSourceEvent).inputSource;
            const {axes} = this.inputSource!.gamepad;

            const raycaster = this.raycaster;
            raycaster.setFromCamera({x: axes[0], y: -axes[1]}, this.xrCamera);
            const intersections = raycaster.intersectObject(this.hitPlane);
    
            if (intersections.length > 0) { 
                this.isTranslating = true;
                this.lastHitPosition.copy(intersections[0].point); 
            } 
            else {
                this.isRotating = true;
            }

            this.lastDragValueX = axes[0];
            this.lastDragValueY = axes[1];
        } 
        else if (fingers.length === 2 /*&& scene.canScale*/) {
            this.isScaling = true;
            this.lastScale = this.getFingerSeparation(fingers) / scene.scale.x;
        }
    }

    protected onSelectEnd = () => {
        if (ENV_DEVELOPMENT) {
            //console.log("WebXR Select End");
        }   

        this.targetOpacity = 0.0;
        this.totalDrag = 0.0;

        this.isTranslating = false;
        this.isRotating = false;
        this.isScaling = false;

        this.inputSource = null;
    }

    protected handleInput( frame: XRFrame ) {
        const hitSource = this.transientHitTestSource;
        if (hitSource == null) { 
            return;
        }
        if (!this.isTranslating && !this.isScaling && !this.isRotating) { 
            return;
        }
        const fingers = frame.getHitTestResultsForTransientInput(hitSource);
        const scene = this.vScene.scene;
        const scale = scene.scale.x;
    
        // Rotating, translating and scaling are mutually exclusive operations; only
        // one can happen at a time, but we can switch during a gesture.
        if (this.isScaling) {
            if (fingers.length < 2) {
                // If we lose the second finger, stop scaling (in fact, stop processing
                // input altogether until a new gesture starts).
                this.isScaling = false;
            } 
            else {
                // calculate and update scale
                const separation = this.getFingerSeparation(fingers);
                const scale = separation / this.lastScale;
                scene.scale.setScalar(scale); 
                scene.position.y = this.lastHitPosition.y - this.modelFloorOffset * scene.scale.y; // set back on floor
                scene.updateMatrix();
                scene.updateMatrixWorld();

                this.shadow.setScaleAndOffset(scale, 0);

                this.updateBoundingBox();
            }
            return;
        } 
        else if (fingers.length === 2 /*&& scene.canScale*/) {
            // If we were rotating or translating and we get a second finger, switch
            // to scaling instead.
            this.isTranslating = false;
            this.isRotating = false;
            this.isScaling = true;
            this.lastScale = this.getFingerSeparation(fingers) / scale;
            return;
        }
    
        if (this.isRotating) { 
            const currentDragX = this.inputSource!.gamepad.axes[0];
            scene.rotation.y += (currentDragX - this.lastDragValueX) * ROTATION_RATE;
            scene.updateMatrix();

            // undo rotation on lights
            _quat.copy(scene.quaternion);
            _quat.invert();
            this.lightTransform.object3D.rotation.setFromQuaternion(_quat); 
            this.lightTransform.object3D.updateMatrix();

            this.shadow.setRotation(scene.rotation.y);

            this.lastDragValueX = currentDragX;
        } 
        else if (this.isTranslating) {
            const currentDrag = this.inputSource!.gamepad.axes;
            const offsetX = currentDrag[0] - this.lastDragValueX;
            const offsetY = currentDrag[1] - this.lastDragValueY;
            this.totalDrag += Math.hypot(offsetX, offsetY);

            fingers.forEach(finger => {
                if (this.totalDrag < 0.01 ||finger.inputSource !== this.inputSource || finger.results.length < 1) {
                    return;
                }
        
                const hit = this.getHitPoint(finger.results[0]);
                if (hit == null) {
                    return;
                }
              
                // add difference from last hit
                _vector3.copy(hit);
                _vector3.sub(this.lastHitPosition);
                scene.position.add(_vector3); 
                scene.updateMatrix();
                scene.updateMatrixWorld();

                this.lastHitPosition.copy(hit);
                

                this.updateBoundingBox();
            });
        }
    }

    protected getFingerSeparation(fingers: XRTransientInputHitTestResult[]): number {
        const fingerOne = fingers[0].inputSource.gamepad.axes;
        const fingerTwo = fingers[1].inputSource.gamepad.axes;
        const deltaX = fingerTwo[0] - fingerOne[0];
        const deltaY = fingerTwo[1] - fingerOne[1];
        return Math.sqrt(deltaX * deltaX + deltaY * deltaY);
    }

    protected placeModel( hit: Vector3 ) {
        const scene = this.vScene.scene!; 
        const {min, max} = _boundingBox;
        const boundingRadius = this.sceneNode.outs.boundingRadius.value;
        const width = Math.max((max.x-min.x)*1.25, 0.15);
        const height = Math.max((max.z-min.z)*1.25, 0.15);
        const centerOffsetX = (min.x+max.x)/2.0;
        const centerOffsetZ = (min.z+max.z)/2.0;

        this.lastHitPosition.copy(hit);

        // add interaction plane
        const hitPlane = this.hitPlane = new Mesh( 
            new PlaneBufferGeometry(width, height),
            new MeshBasicMaterial()   
        );
        hitPlane.position.set(centerOffsetX, min.y, centerOffsetZ);
        hitPlane.rotation.set(-Math.PI / 2.0, 0, 0);
        hitPlane.visible = false;
        scene.add(hitPlane);

        // add selection visualization
        const roundedRectShape = new Shape();
        const cutOut = new Shape();
        const thickness = width > height ? width*0.025 : height*0.025; 
        this.roundedRect(roundedRectShape, -width/2.0, -height/2.0, width, height, thickness*0.5);
        this.roundedRect(cutOut, -width/2.0 + thickness, -height/2.0 + thickness, width-2*thickness, height-2*thickness, thickness*0.4);
        roundedRectShape.holes.push(cutOut);
        let geometry = new ShapeBufferGeometry(roundedRectShape);
        const selectionRing = this.selectionRing = new Mesh( geometry, new MeshBasicMaterial({ side: DoubleSide, opacity: 0.0 }) );
        selectionRing.position.set(centerOffsetX, min.y, centerOffsetZ);
        selectionRing.rotation.set(-Math.PI / 2.0, 0, 0);
        (selectionRing.material as Material).transparent = true;
        selectionRing.visible = false;
        scene.add(selectionRing);

        this.modelFloorOffset = min.y;

        //console.log("Placing in AR: " + hit.x + " " + (hit.y-min.y) + " " + hit.z);

        scene.position.set(hit.x, hit.y-min.y, hit.z);
        scene.updateMatrix();
        scene.updateMatrixWorld(true);
        this.updateBoundingBox();
        this.pulse.pulse(Date.now());
           
        // if we are not far enough away from the model, shift
        // edge of bounding box to hitpoint so it is in view
        const origin = this.camera.position.clone();
        const placementVector = hit.clone().sub(origin);
        if(placementVector.length() < boundingRadius) {
            const direction = placementVector.normalize();
            // Pull camera back enough to be outside of large models.
            origin.sub(direction.multiplyScalar(boundingRadius * 1.5));
            const ray = new Ray(origin, direction.normalize());
            const modelPosition = new Vector3();
        
            // Make the box tall so that we don't intersect the top face.
            max.y += 10;
            ray.intersectBox(this.sceneNode.outs.boundingBox.value, modelPosition);
            max.y -= 10;
        
            if (modelPosition != null) {
                scene.position.x += hit.x - modelPosition.x;
                scene.position.z += hit.z - modelPosition.z;
                scene.updateMatrix(); 
                scene.updateMatrixWorld(true);
                //console.log("Pushing in AR: " + scene.position.x + " " + (hit.y-min.y) + " " + scene.position.z );
            } 
        } 
    
        this.updateBoundingBox();
        this.outs.isPlaced.setValue(true); 
    }

    protected launchSceneViewer() {
        const models = this.sceneNode.getGraphComponents(CVModel2);
        const svIndex = models.findIndex(model => {return model.derivatives.get(EDerivativeUsage.App3D, EDerivativeQuality.AR) !== null});
        const derivative = svIndex > -1 ? models[svIndex].derivatives.get(EDerivativeUsage.App3D, EDerivativeQuality.AR) : null;
        
        if(derivative) {
            const linkElement = this.arLink;
            const modelAsset = derivative.findAsset(EAssetType.Model);
            const url = this.assetManager.getAssetUrl(modelAsset.data.uri);

            const intent = `intent://arvr.google.com/scene-viewer/1.0?file=${url}&mode=ar_only#Intent;scheme=https;package=com.google.ar.core;action=android.intent.action.VIEW;end;`;
            
            linkElement.setAttribute('href', intent);
            linkElement.click();
        }
    }

    protected launchQuickLook() {
        const models = this.sceneNode.getGraphComponents(CVModel2);
        const iOSIndex = models.findIndex(model => {return model.derivatives.get(EDerivativeUsage.iOSApp3D, EDerivativeQuality.AR) !== null});
        const derivative = iOSIndex > -1 ? models[iOSIndex].derivatives.get(EDerivativeUsage.iOSApp3D, EDerivativeQuality.AR) : null;
        
        if(derivative) {
            const linkElement = this.arLink;
            const modelAsset = derivative.findAsset(EAssetType.Model);
            const url = this.assetManager.getAssetUrl(modelAsset.data.uri);

            linkElement.setAttribute('rel', 'ar');
            const img = document.createElement('img');
            linkElement.appendChild(img);
            linkElement.setAttribute('href', url.toString());
            linkElement.click();
            linkElement.removeChild(img);
        }
    }

    // Update scene bounding box to ensure dependent functionality works correctly
    protected updateBoundingBox() {
        this.sceneNode.ins.sceneTransformed.set();
    }

    // Animate opacity based on time delta
    protected updateOpacity( deltaT: number, target: number) { 
        const material = this.selectionRing.material as Material;   
        const currentOpacity = material.opacity;   
        if(target === currentOpacity) {
            return;
        }

        const deltaO = target - currentOpacity;
        material.opacity = deltaO > 0 ? Math.min(currentOpacity + 0.002*deltaT, target) : Math.max(currentOpacity - 0.002*deltaT, target);

        this.selectionRing.visible = material.opacity > 0;
    }

    // Helper function to generate rounded rectangle shape from Three.js example:
    // https://github.com/mrdoob/three.js/blob/dev/examples/webgl_geometry_shapes.html
    protected roundedRect( ctx, x, y, width, height, radius ) {

        ctx.moveTo( x, y + radius );
        ctx.lineTo( x, y + height - radius );
        ctx.quadraticCurveTo( x, y + height, x + radius, y + height );
        ctx.lineTo( x + width - radius, y + height );
        ctx.quadraticCurveTo( x + width, y + height, x + width, y + height - radius );
        ctx.lineTo( x + width, y + radius );
        ctx.quadraticCurveTo( x + width, y, x + width - radius, y );
        ctx.lineTo( x + radius, y );
        ctx.quadraticCurveTo( x, y, x, y + radius );

    }
}