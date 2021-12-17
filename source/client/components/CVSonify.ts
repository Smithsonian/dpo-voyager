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
        scanning: types.Boolean("Sonify.Scanning", false),
        visible: types.Boolean("Sonify.Visible", false),
        closed: types.Event("Sonify.Closed"),
        mode: types.Enum("Sonify.Mode", ESonifyMode, ESonifyMode.Frequency),
    };

    protected static readonly outs = {
        mode: types.Enum("Sonify.Mode", ESonifyMode, ESonifyMode.Frequency),
        scanline: types.Number("Sonify.Scanline", 0),
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
    protected scanIterval: number = null;
    protected beepElement: HTMLAudioElement = null;
    protected sonifyDot: HTMLDivElement = null;

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

        this.beepElement = document.createElement("audio");
        this.beepElement.src = "data:audio/wav;base64,//uQRAAAAWMSLwUIYAAsYkXgoQwAEaYLWfkWgAI0wWs/ItAAAGDgYtAgAyN"
            + "+QWaAAihwMWm4G8QQRDiMcCBcH3Cc+CDv/7xA4Tvh9Rz/y8QADBwMWgQAZG/ILNAARQ4GLTcDeIIIhxGOBAuD7hOfBB3/94gcJ"
            + "3w+o5/5eIAIAAAVwWgQAVQ2ORaIQwEMAJiDg95G4nQL7mQVWI6GwRcfsZAcsKkJvxgxEjzFUgfHoSQ9Qq7KNwqHwuB13MA4a1q"
            + "/DmBrHgPcmjiGoh//EwC5nGPEmS4RcfkVKOhJf+WOgoxJclFz3kgn//dBA+ya1GhurNn8zb//9NNutNuhz31f////9vt///z+I"
            + "dAEAAAK4LQIAKobHItEIYCGAExBwe8jcToF9zIKrEdDYIuP2MgOWFSE34wYiR5iqQPj0JIeoVdlG4VD4XA67mAcNa1fhzA1jwH"
            + "uTRxDUQ//iYBczjHiTJcIuPyKlHQkv/LHQUYkuSi57yQT//uggfZNajQ3Vmz+Zt//+mm3Wm3Q576v////+32///5/EOgAAADVg"
            + "hQAAAAA//uQZAUAB1WI0PZugAAAAAoQwAAAEk3nRd2qAAAAACiDgAAAAAAABCqEEQRLCgwpBGMlJkIz8jKhGvj4k6jzRnqasNK"
            + "Ieoh5gI7BJaC1A1AoNBjJgbyApVS4IDlZgDU5WUAxEKDNmmALHzZp0Fkz1FMTmGFl1FMEyodIavcCAUHDWrKAIA4aa2oCgILEB"
            + "upZgHvAhEBcZ6joQBxS76AgccrFlczBvKLC0QI2cBoCFvfTDAo7eoOQInqDPBtvrDEZBNYN5xwNwxQRfw8ZQ5wQVLvO8OYU+mH"
            + "vFLlDh05Mdg7BT6YrRPpCBznMB2r//xKJjyyOh+cImr2/4doscwD6neZjuZR4AgAABYAAAABy1xcdQtxYBYYZdifkUDgzzXaXn"
            + "98Z0oi9ILU5mBjFANmRwlVJ3/6jYDAmxaiDG3/6xjQQCCKkRb/6kg/wW+kSJ5//rLobkLSiKmqP/0ikJuDaSaSf/6JiLYLEYnW"
            + "/+kXg1WRVJL/9EmQ1YZIsv/6Qzwy5qk7/+tEU0nkls3/zIUMPKNX/6yZLf+kFgAfgGyLFAUwY//uQZAUABcd5UiNPVXAAAApAA"
            + "AAAE0VZQKw9ISAAACgAAAAAVQIygIElVrFkBS+Jhi+EAuu+lKAkYUEIsmEAEoMeDmCETMvfSHTGkF5RWH7kz/ESHWPAq/kcCRhqBtMdokPdM7vil7RG98A2sc7zO6ZvTdM7pmOUAZTnJW+NXxqmd41dqJ6mLTXxrPpnV8avaIf5SvL7pndPvPpndJR9Kuu8fePvuiuhorgWjp7Mf/PRjxcFCPDkW31srioCExivv9lcwKEaHsf/7ow2Fl1T/9RkXgEhYElAoCLFtMArxwivDJJ+bR1HTKJdlEoTELCIqgEwVGSQ+hIm0NbK8WXcTEI0UPoa2NbG4y2K00JEWbZavJXkYaqo9CRHS55FcZTjKEk3NKoCYUnSQ0rWxrZbFKbKIhOKPZe1cJKzZSaQrIyULHDZmV5K4xySsDRKWOruanGtjLJXFEmwaIbDLX0hIPBUQPVFVkQkDoUNfSoDgQGKPekoxeGzA4DUvnn4bxzcZrtJyipKfPNy5w+9lnXwgqsiyHNeSVpemw4bWb9psYeq//uQZBoABQt4yMVxYAIAAAkQoAAAHvYpL5m6AAgAACXDAAAAD59jblTirQe9upFsmZbpMudy7Lz1X1DYsxOOSWpfPqNX2WqktK0DMvuGwlbNj44TleLPQ+Gsfb+GOWOKJoIrWb3cIMeeON6lz2umTqMXV8Mj30yWPpjoSa9ujK8SyeJP5y5mOW1D6hvLepeveEAEDo0mgCRClOEgANv3B9a6fikgUSu/DmAMATrGx7nng5p5iimPNZsfQLYB2sDLIkzRKZOHGAaUyDcpFBSLG9MCQALgAIgQs2YunOszLSAyQYPVC2YdGGeHD2dTdJk1pAHGAWDjnkcLKFymS3RQZTInzySoBwMG0QueC3gMsCEYxUqlrcxK6k1LQQcsmyYeQPdC2YfuGPASCBkcVMQQqpVJshui1tkXQJQV0OXGAZMXSOEEBRirXbVRQW7ugq7IM7rPWSZyDlM3IuNEkxzCOJ0ny2ThNkyRai1b6ev//3dzNGzNb//4uAvHT5sURcZCFcuKLhOFs8mLAAEAt4UWAAIABAAAAAB4qbHo0tIjVkUU//uQZAwABfSFz3ZqQAAAAAngwAAAE1HjMp2qAAAAACZDgAAAD5UkTE1UgZEUExqYynN1qZvqIOREEFmBcJQkwdxiFtw0qEOkGYfRDifBui9MQg4QAHAqWtAWHoCxu1Yf4VfWLPIM2mHDFsbQEVGwyqQoQcwnfHeIkNt9YnkiaS1oizycqJrx4KOQjahZxWbcZgztj2c49nKmkId44S71j0c8eV9yDK6uPRzx5X18eDvjvQ6yKo9ZSS6l//8elePK/Lf//IInrOF/FvDoADYAGBMGb7FtErm5MXMlmPAJQVgWta7Zx2go+8xJ0UiCb8LHHdftWyLJE0QIAIsI+UbXu67dZMjmgDGCGl1H+vpF4NSDckSIkk7Vd+sxEhBQMRU8j/12UIRhzSaUdQ+rQU5kGeFxm+hb1oh6pWWmv3uvmReDl0UnvtapVaIzo1jZbf/pD6ElLqSX+rUmOQNpJFa/r+sa4e/pBlAABoAAAAA3CUgShLdGIxsY7AUABPRrgCABdDuQ5GC7DqPQCgbbJUAoRSUj+NIEig0YfyWUho1VBBBA//uQZB4ABZx5zfMakeAAAAmwAAAAF5F3P0w9GtAAACfAAAAAwLhMDmAYWMgVEG1U0FIGCBgXBXAtfMH10000EEEEEECUBYln03TTTdNBDZopopYvrTTdNa325mImNg3TTPV9q3pmY0xoO6bv3r00y+IDGid/9aaaZTGMuj9mpu9Mpio1dXrr5HERTZSmqU36A3CumzN/9Robv/Xx4v9ijkSRSNLQhAWumap82WRSBUqXStV/YcS+XVLnSS+WLDroqArFkMEsAS+eWmrUzrO0oEmE40RlMZ5+ODIkAyKAGUwZ3mVKmcamcJnMW26MRPgUw6j+LkhyHGVGYjSUUKNpuJUQoOIAyDvEyG8S5yfK6dhZc0Tx1KI/gviKL6qvvFs1+bWtaz58uUNnryq6kt5RzOCkPWlVqVX2a/EEBUdU1KrXLf40GoiiFXK///qpoiDXrOgqDR38JB0bw7SoL+ZB9o1RCkQjQ2CBYZKd/+VJxZRRZlqSkKiws0WFxUyCwsKiMy7hUVFhIaCrNQsKkTIsLivwKKigsj8XYlwt/WKi2N4d//uQRCSAAjURNIHpMZBGYiaQPSYyAAABLAAAAAAAACWAAAAApUF/Mg+0aohSIRobBAsMlO//Kk4soosy1JSFRYWaLC4qZBYWFRGZdwqKiwkNBVmoWFSJkWFxX4FFRQWR+LsS4W/rFRb/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////VEFHAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAU291bmRib3kuZGUAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAMjAwNGh0dHA6Ly93d3cuc291bmRib3kuZGUAAAAAAAAAACU=";
            
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

        if (ins.active.changed || ins.scanning.changed) {
            if(ins.active.value || ins.scanning.value) {
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

                this.analytics.sendProperty("Menu.Sonify", true);

                if(ins.active.value) {
                    this.isPlaying = true;
                }
                else {
                    this.startScanlines();
                }         
            }
            else {
                if(this.gain) {
                    this.oscillator.stop();
                    this.bufferSource.stop();

                    if(this.outs.mode.value === ESonifyMode.Beep) {
                        this.bufferSource.disconnect(this.gain);
                    }
                    else {
                        this.oscillator.disconnect(this.gain);
                    }

                    this.isPlaying = false;
                    clearInterval(this.scanIterval);

                    this.gain.disconnect(this.audioCtx.destination);

                    this.gain = null;
                    this.oscillator = null;
                    this.bufferSource = null;

                    console.log("Stopping Audio");
                }
            }
        }
        else if(ins.mode.changed) {
            const outMode = outs.mode;
            const inMode = ins.mode.value;
            const osc = this.oscillator;
            const gainNode = this.gain;

            if(inMode === outMode.value) {
                return false;
            }

            if(this.ins.active.value) {
                gainNode.gain.value  = inMode === ESonifyMode.Volume ? _lowVolume : 1.0;
                osc.frequency.value = inMode === ESonifyMode.Volume ? 133 : 100;
            
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
        
        if(ins.visible.changed) {
            const navigation = this.setup.navigation;
            if(ins.visible.value) {
                navigation.ins.enabled.setValue(false, true);
                navigation.ins.preset.on("value", this.onViewChange, this);
            }
            else {
                navigation.ins.preset.off("value", this.onViewChange, this);
                navigation.ins.enabled.setValue(true, true);
            }
        }
        return true;
    }

    protected onPointer(event: IPointerEvent)
    {
        /*if(event.type === "pointer-up") {
            this.oscillator.frequency.value = 100;
            this.gain.gain.value = 1.0;
            this.bufferSource.loopEnd = 1.0;
            return;
        }*/

        if(this.isPlaying) {
            this.updateSonification(event.localX, event.localY);
        }
    }

    protected updateSonification(x: number, y: number) {
        const renderer = this.renderer.views[0].renderer;
        const buffer = this.pickBuffer;
        const limits = this.depthLimits;

        renderer.readRenderTargetPixels(this.convTarget, x, window.innerHeight-y, 1, 1, buffer);

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

        //console.log(x + " " + y + " DEPTH: " + nDepth);
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

    protected startScanlines() {
        let elapsedTime = 0;
        let lineCount = 0;
        const depthTarget = this.convTarget;
        const height = depthTarget.height;
        const width = depthTarget.width;
        const increment = 2000/width;
        this.scanIterval = window.setInterval(() => {

            if(elapsedTime === 0) {
                this.beepElement.currentTime = 0;
                this.beepElement.play();
            }

            elapsedTime += increment;

            if(elapsedTime > 2000) {
                lineCount++;
                this.outs.scanline.setValue((height/20)*lineCount);
                elapsedTime = 0;
            }

            if(lineCount > 20) {
                //clearInterval(this.scanIterval);
                this.ins.scanning.setValue(false);
                return;
            }

            this.updateSonification(width*(elapsedTime/2000), (height/20)*lineCount);
        }, increment);
    }
}