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

import Component, { types } from "@ff/graph/Component";
import { IPointerEvent } from "@ff/scene/RenderView";
import CRenderer from "client/../../libs/ff-scene/source/components/CRenderer";
import { WebGLRenderTarget, RGBFormat, NearestFilter, DepthTexture, UnsignedShortType, DepthFormat, UnsignedIntType, Vector3, Color, PlaneGeometry, MeshBasicMaterial, Mesh, DoubleSide, SphereGeometry, BoxGeometry, Box3, Plane, Scene, OrthographicCamera, RGBAFormat } from "three";
import DepthShader from "../shaders/DepthShader";
import MinMaxShader from "../shaders/MinMaxShader";
import { EProjection } from "client/../../libs/ff-three/source/UniversalCamera";
import CVScene from "./CVScene";
import CVSetup from "./CVSetup";
import CVAnalytics from "./CVAnalytics";

////////////////////////////////////////////////////////////////////////////////

const corners = [[1,1,1],[0,1,1],[0,0,1],[1,0,1],[0,0,0],[0,1,0],[1,1,0],[1,0,0]];

const _target: Vector3 = new Vector3();
const _dir: Vector3 = new Vector3();
const _color = new Color();
const _plane = new Plane();
const _box = new Box3();
const _lowVolume: number = 0.25;

export enum ESonifyMode { Frequency, Volume, Beep };

export default class CVSonify extends Component
{
    static readonly typeName: string = "CVSonify";

    protected static readonly ins = {
        active: types.Boolean("Sonify.Active", false),
        visible: types.Boolean("Sonify.Visible", false),
        closed: types.Event("Sonify.Closed"),
        mode: types.Enum("Sonify.Mode", ESonifyMode, ESonifyMode.Frequency),
    };

    protected static readonly outs = {
        mode: types.Enum("Sonify.Mode", ESonifyMode, ESonifyMode.Frequency),
    };

    protected get renderer() {
        return this.getMainComponent(CRenderer);
    }
    protected get sceneNode() {
        return this.getSystemComponent(CVScene);
    }
    protected get setup() {
        return this.getSystemComponent(CVSetup);
    }
    protected get analytics() {
        return this.system.getMainComponent(CVAnalytics);
    }

    protected audioCtx: AudioContext = null;
    protected oscillator: OscillatorNode = null;
    protected bufferSource: AudioBufferSourceNode = null;
    protected gain: GainNode = null;
    protected convTarget: WebGLRenderTarget = null;
    protected pickBuffer: Uint8Array;
    protected depthShader: DepthShader;
    protected minMaxShader: MinMaxShader;
    protected depthLimits: number[] = [];

    protected isPlaying: boolean = false;

    ins = this.addInputs(CVSonify.ins);
    outs = this.addOutputs(CVSonify.outs);

    create()
    {
        super.create();

        //this.system.on(["pointer-down", "pointer-up", "pointer-move"], this.onPointer, this);
        this.system.on(["pointer-hover", "pointer-move"], this.onPointer, this);
        
        const AudioContext = window.AudioContext;// || window.webkitAudioContext;
        this.audioCtx = new AudioContext();

        this.convTarget = new WebGLRenderTarget( window.innerWidth, window.innerHeight, { stencilBuffer: false } );

        this.pickBuffer = new Uint8Array(4);
        this.depthShader = new DepthShader();
        this.minMaxShader = new MinMaxShader();

        window.addEventListener("resize", this.debounce(this.onResize, 200, false));
        window.addEventListener("fullscreenchange", this.onResize);
    }

    dispose()
    {
        if(this.audioCtx) {
            this.audioCtx.close();
        }

        //this.system.off(["pointer-down", "pointer-up", "pointer-move"], this.onPointer, this);
        this.system.off(["pointer-hover", "pointer-move"], this.onPointer, this);

        window.removeEventListener("fullscreenchange", this.onResize);
        window.removeEventListener("resize", this.debounce(this.onResize, 200, false));
        
        super.dispose();
    }

    update(context)
    {
        const { ins, outs } = this;

        if (ins.active.changed) {
            if(ins.active.value) {
                console.log("Playing Audio Context");

                this.generateDepthMap();

                if (this.audioCtx.state === 'suspended') {
                    this.audioCtx.resume();
                }

                const gainNode = this.gain = this.audioCtx.createGain();
                gainNode.connect(this.audioCtx.destination);
                gainNode.gain.value = outs.mode.value === ESonifyMode.Volume ? _lowVolume : 1.0;

                const osc = this.oscillator = this.audioCtx.createOscillator();
                osc.type = 'sine';
                osc.frequency.value = outs.mode.value === ESonifyMode.Volume ? 133 : 100;
                osc.start();

                this.setupBufferSource();
                this.bufferSource.start(0);

                if(this.outs.mode.value === ESonifyMode.Beep) {
                    this.bufferSource.connect(gainNode);
                }
                else {
                    osc.connect(gainNode);
                }

                this.setup.navigation.ins.enabled.setValue(false, true);
                this.setup.navigation.ins.preset.on("value", this.onViewChange, this);

                this.analytics.sendProperty("Menu.Sonify", true);
                this.isPlaying = true;            
            }
            else {
                if(this.isPlaying) {
                    this.oscillator.stop();
                    this.bufferSource.stop();

                    if(this.outs.mode.value === ESonifyMode.Beep) {
                        this.bufferSource.disconnect(this.gain);
                    }
                    else {
                        this.oscillator.disconnect(this.gain);
                    }

                    this.isPlaying = false;

                    this.gain.disconnect(this.audioCtx.destination);

                    this.setup.navigation.ins.preset.off("value", this.onViewChange, this);
                    this.setup.navigation.ins.enabled.setValue(true, true);

                    console.log("Stopping Audio");
                }
            }
        }
        else if(ins.mode.changed) {
            const outMode = this.outs.mode;
            const inMode = ins.mode.value;
            const osc = this.oscillator;
            const gainNode = this.gain;

            if(inMode === outMode.value) {
                return false;
            }

            gainNode.gain.value  = inMode === ESonifyMode.Volume ? _lowVolume : 1.0;
            osc.frequency.value = inMode === ESonifyMode.Volume ? 133 : 100;

            if(this.ins.active.value) {
                if(inMode === ESonifyMode.Beep) {   
                    osc.disconnect(gainNode);
                    this.bufferSource.connect(gainNode);
                }
                else {
                    if(outMode.value  === ESonifyMode.Beep) {
                        this.bufferSource.disconnect(gainNode);
                        osc.connect(gainNode);
                    }   
                }
            }

            outMode.setValue(inMode);
        }
        return true;
    }

    protected onPointer(event: IPointerEvent)
    {
        if(this.isPlaying) {
            /*if(event.type === "pointer-up") {
                this.oscillator.frequency.value = 100;
                this.gain.gain.value = 1.0;
                this.bufferSource.loopEnd = 1.0;
                return;
            }*/

            const renderer = this.renderer.views[0].renderer;
            const buffer = this.pickBuffer;
            const limits = this.depthLimits;

            renderer.readRenderTargetPixels(this.convTarget, event.localX, window.innerHeight-event.localY, 1, 1, buffer);

            const depth = buffer[3] * 2.337437050015319e-10 
            + buffer[2] * 5.983838848039216e-8 
            + buffer[1] * 1.531862745098039e-5 
            + buffer[0] * 0.003921568627451;

            // Normalize depth
            const nDepth = Math.max((depth - limits[0])/(limits[1] - limits[0]), 0);

            if(this.ins.mode.value === ESonifyMode.Frequency) {
                this.oscillator.frequency.value = nDepth <= 0.000001 ? 100 : 100 + 700*(1.0-nDepth);
            }
            else if(this.ins.mode.value === ESonifyMode.Volume) {
                this.gain.gain.value = nDepth <= 0.000001 ? _lowVolume : _lowVolume + 10.0*(1.0-nDepth);
            }
            else {
                this.bufferSource.loopEnd =  nDepth <= 0.000001 ? 1.0 : 1 / ((60 + (440.0*(1.0-nDepth))) / 60);
            }

            //console.log(event.localX + " " + event.localY + " DEPTH: " + nDepth);
        }
    }

    protected generateDepthMap()
    {
        const sceneComponent = this.system.getComponent(CRenderer, true).activeSceneComponent;
        const scene = sceneComponent && sceneComponent.scene;
        const sceneNode = this.sceneNode;
        const camera = sceneComponent && sceneComponent.activeCamera;
        const bbox = /*sceneNode.models.length === 1 ? _box.copy(sceneNode.models[0].localBoundingBox).applyMatrix4(sceneNode.models[0].object3D.matrixWorld)
                                                     :*/ sceneNode.outs.boundingBox.value;
        const reducedTargets: WebGLRenderTarget[] = [];

        // Create reducing power of 2 render targets for finding min/max depth
        let height = this.getPowerOfTwo(this.convTarget.height);
        let width = this.getPowerOfTwo(this.convTarget.width);
        while(height > 1 || width > 1) {
            height = Math.max(height/2, 1);
            width = Math.max(width/2, 1);
            reducedTargets.push(new WebGLRenderTarget( width, height, { stencilBuffer: false, minFilter: NearestFilter, magFilter: NearestFilter } ));
        }

        const oldFarPlane = camera.far;
        const oldNearPlane = camera.near;

        camera.getWorldDirection(_dir);
        camera.getWorldPosition(_target);

        _plane.set(_dir, _target.length());

        // Calculate new near and far planes based on bbox
        camera.far = 0;
        camera.near = 1000000;
        corners.forEach(corner => {
            _target.set(bbox.max.x*corner[0]+bbox.min.x*(1-corner[0]),
                bbox.max.y*corner[1]+bbox.min.y*(1-corner[1]),
                bbox.max.z*corner[2]+bbox.min.z*(1-corner[2])); 
            
            camera.far = Math.max(camera.far, _plane.distanceToPoint(_target));
            camera.near = Math.min(camera.near, _plane.distanceToPoint(_target));
        });

        camera.updateProjectionMatrix();

        // TEMP
        /*camera.getWorldPosition(_target);
        camera.getWorldDirection(_dir);
        var geometry = new PlaneGeometry(100, 100);
        var material = new MeshBasicMaterial({ color: 0xff0000, side: DoubleSide, transparent: true, opacity: 0.5 });
        var mesh = new Mesh(geometry, material);
        var mesh2 = new Mesh(geometry, material);
        mesh.lookAt(_target);
        mesh2.lookAt(_target);
        const dirNorm = _dir.normalize();
        const offset = dirNorm.multiplyScalar(camera.near);
        const newLoc = _target;
        newLoc.add(offset);
        mesh.position.set(newLoc.x, newLoc.y, newLoc.z);
        sceneComponent.scene.add(mesh);

        //const geometry2 = new SphereGeometry( boundingRadius, 128, 128 );
        var size = new Vector3();
        bbox.getSize(size); console.log("Getting bounds: " + JSON.stringify(size));
        const geometry2 = new BoxGeometry( size.x, size.y, size.z );
        const sphere = new Mesh( geometry2, material );
        var center = new Vector3();
        bbox.getCenter(center);
        sphere.position.set(center.x, center.y, center.z);
        sceneComponent.scene.add(sphere);

        camera.getWorldPosition(_target);
        camera.getWorldDirection(_dir);
        const dirNorm2 = _dir.normalize();
        const offset2 = dirNorm2.multiplyScalar(camera.far);
        const newLoc2 = _target;
        newLoc2.add(offset2);
        mesh2.position.set(newLoc2.x, newLoc2.y, newLoc2.z);
        sceneComponent.scene.add(mesh2);*/
        // TEMP

        const renderer = this.renderer.views[0].renderer;  
        
        const overrideMaterial = scene.overrideMaterial;
        renderer.getClearColor(_color);
        renderer.setClearColor(0, 0);

        this.depthShader.uniforms.cameraNear.value = camera.near;
        this.depthShader.uniforms.cameraFar.value = camera.far;
        scene.overrideMaterial = this.depthShader;
        renderer.setRenderTarget( this.convTarget );
        renderer.clear();
        renderer.render( scene, camera );
        renderer.setRenderTarget( null );
        
        scene.overrideMaterial = overrideMaterial;

        camera.far = oldFarPlane;
        camera.near = oldNearPlane;
        camera.updateProjectionMatrix();


        // Find depth min/max
        const sceneRTT = new Scene();
        const plane = new PlaneGeometry( window.innerWidth, window.innerHeight );
		const quad = new Mesh( plane );
        quad.position.z = - 100;
        sceneRTT.add(quad);

        const cameraRTT = new OrthographicCamera( window.innerWidth / - 2, window.innerWidth / 2, window.innerHeight / 2, window.innerHeight / - 2, - 10000, 10000 );
                cameraRTT.position.z = 100;
                
        const passes: number[] = [0,1];

        passes.forEach(pass => {
            this.minMaxShader.uniforms.tDepth.value = this.convTarget.texture;
            this.minMaxShader.uniforms.xStep.value = 1.0 / this.convTarget.width;
            this.minMaxShader.uniforms.yStep.value = 1.0 / this.convTarget.height;
            this.minMaxShader.uniforms.pass.value = pass;
            
            reducedTargets.forEach(target => {
                this.minMaxShader.uniforms.xOffset.value = 1.0 / target.width;
                this.minMaxShader.uniforms.yOffset.value = 1.0 / target.height;

                sceneRTT.overrideMaterial = this.minMaxShader;
                renderer.setRenderTarget( target );
                renderer.clear();
                renderer.render( sceneRTT, cameraRTT );
                sceneRTT.overrideMaterial = overrideMaterial;

                this.minMaxShader.uniforms.tDepth.value = target.texture;
                this.minMaxShader.uniforms.xStep.value = 1.0 / target.width;
                this.minMaxShader.uniforms.yStep.value = 1.0 / target.height;

                /*var material = new MeshBasicMaterial( {map:this.minMaxShader.uniforms.tDepth.value} );
                quad.material = material;
                renderer.setRenderTarget( null );
                renderer.render( scene2, cameraRTT );
                var dataURL = renderer.domElement.toDataURL();
                console.log(dataURL);*/
            });

            const buffer = this.pickBuffer;
            const finalTarget = reducedTargets[reducedTargets.length-1];
            renderer.readRenderTargetPixels(finalTarget, 0, 0, 1, 1, buffer);

            const depth = buffer[3] * 2.337437050015319e-10 
            + buffer[2] * 5.983838848039216e-8 
            + buffer[1] * 1.531862745098039e-5 
            + buffer[0] * 0.003921568627451;

            passes[pass] = depth;
        })

        renderer.setClearColor(_color);
        renderer.setRenderTarget( null );
        
        this.depthLimits = passes;

        //console.log("Min: " + passes[0] + " Max: " + passes[1]);
    }

    protected onViewChange()
    {
        const navigation = this.setup.navigation;
        navigation.ins.enabled.setValue(true);
        navigation.update();
        navigation.tick();
        navigation.ins.enabled.setValue(false);
        this.generateDepthMap();
    }

    protected onResize = () => 
    {   
        if(this.ins.active.value) {
            this.convTarget.dispose();
            this.convTarget = new WebGLRenderTarget( window.innerWidth, window.innerHeight, { stencilBuffer: false } );
            this.generateDepthMap();
        }
    }

    protected getPowerOfTwo(input: number)
    {
        input--;
        input |= input >> 1;
        input |= input >> 2;
        input |= input >> 4;
        //input |= input >> 8;
        //input |= input >> 16;
        input++;

        return input;
    }

    // From underscore.js
    protected debounce(func: Function, wait: number, immediate: boolean) {
        var timeout;
        return function() {
            var context = this, args = arguments;
            var later = function() {
                timeout = null;
                if (!immediate) func.apply(context, args);
            };
            var callNow = immediate && !timeout;
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
            if (callNow) func.apply(context, args);
        };
    };

    // Adapted from: https://github.com/padenot/metro/blob/master/metro.js.md
    // MIT License, Copyright (c) 2014 Paul Adenot
    // https://github.com/padenot/metro/blob/master/LICENSE
    protected setupBufferSource() {
        const ac = this.audioCtx;
        const buf = ac.createBuffer(1, ac.sampleRate * 2, ac.sampleRate);
        const channel = buf.getChannelData(0);
        let phase = 0;
        let amp = 1;
        const duration_frames = ac.sampleRate / 50;
        const f = 330;
        for (var i = 0; i < duration_frames; i++) {
          channel[i] = Math.sin(phase) * amp;
          phase += 2 * Math.PI * f / ac.sampleRate;
          if (phase > 2 * Math.PI) {
            phase -= 2 * Math.PI;
          }
          amp -= 1 / duration_frames;
        }
        const source = this.bufferSource = ac.createBufferSource();
        source.buffer = buf;
        source.loop = true;
        source.loopEnd = 1 / (60 / 60);
    }
}