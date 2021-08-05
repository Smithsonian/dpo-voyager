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
import { WebGLRenderTarget, RGBFormat, NearestFilter, DepthTexture, UnsignedShortType, DepthFormat, UnsignedIntType, Vector3, Color, PlaneGeometry, MeshBasicMaterial, Mesh, DoubleSide, SphereGeometry, BoxGeometry, Box3, Plane } from "three";
import DepthShader from "../shaders/DepthShader";
import { EProjection } from "client/../../libs/ff-three/source/UniversalCamera";
import CVScene from "./CVScene";
import CVSetup from "./CVSetup";

////////////////////////////////////////////////////////////////////////////////

const corners = [[1,1,1],[0,1,1],[0,0,1],[1,0,1],[0,0,0],[0,1,0],[1,1,0],[1,0,0]];

const _target: Vector3 = new Vector3();
const _dir: Vector3 = new Vector3();
const _color = new Color();
const _plane = new Plane();
const _box = new Box3();

export default class CVSonify extends Component
{
    static readonly typeName: string = "CVSonify";

    protected static readonly ins = {
        active: types.Boolean("Sonify.Active", false)
    };

    protected static readonly outs = {
        //documentTitle: types.String("Document.Title"),
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

    protected audioCtx: AudioContext = null;
    protected oscillator: OscillatorNode = null;
    protected gain: GainNode = null;
    //protected target: WebGLRenderTarget = null;
    protected convTarget: WebGLRenderTarget = null;
    protected pickBuffer: Uint8Array;
    protected depthShader: DepthShader;

    protected isPlaying: boolean = false;

    ins = this.addInputs(CVSonify.ins);
    outs = this.addOutputs(CVSonify.outs);

    create()
    {
        super.create();

        this.system.on(["pointer-down", "pointer-up", "pointer-move"], this.onPointer, this);
        
        const AudioContext = window.AudioContext;// || window.webkitAudioContext;
        this.audioCtx = new AudioContext();

        /*this.target = new WebGLRenderTarget( window.innerWidth, window.innerHeight );
        this.target.texture.format = RGBFormat;
        this.target.texture.minFilter = NearestFilter;
        this.target.texture.magFilter = NearestFilter;
        this.target.texture.generateMipmaps = false;
        this.target.stencilBuffer = false;
        this.target.depthBuffer = true;
        this.target.depthTexture = new DepthTexture(window.innerWidth, window.innerHeight);
        this.target.depthTexture.format = DepthFormat;
        this.target.depthTexture.type = UnsignedIntType;*/

        this.convTarget = new WebGLRenderTarget( window.innerWidth, window.innerHeight, { stencilBuffer: false } );

        this.pickBuffer = new Uint8Array(4);
        this.depthShader = new DepthShader();
    }

    dispose()
    {
        if(this.audioCtx) {
            this.audioCtx.close();
        }

        this.system.off(["pointer-down", "pointer-up", "pointer-move"], this.onPointer, this);
        
        super.dispose();
    }

    update(context)
    {
        const { ins } = this;

        if (ins.active.changed) {
            if(ins.active.value) {
                console.log("Playing Audio Context");

                this.generateDepthMap();

                if (this.audioCtx.state === 'suspended') {
                    this.audioCtx.resume();
                }

                const osc = this.oscillator = this.audioCtx.createOscillator();
                osc.type = 'sine';
                osc.frequency.value = 100;
                osc.connect(this.audioCtx.destination);
                osc.start();

                this.setup.navigation.ins.enabled.setValue(false);
                this.setup.navigation.ins.preset.on("value", this.onViewChange, this);

                this.isPlaying = true;            
            }
            else {
                if(this.isPlaying) {
                    this.oscillator.stop();
                    this.oscillator.disconnect(this.audioCtx.destination);
                    this.isPlaying = false;

                    this.setup.navigation.ins.preset.off("value", this.onViewChange, this);
                    this.setup.navigation.ins.enabled.setValue(true);

                    console.log("Stopping Audio");
                }
            }
        }
        return true;
    }

    fromData(data: CVSonify)
    {
        /*data = data || {} as IInterface;

        this.ins.setValues({
            visible: data.visible !== undefined ? data.visible : true,
            logo: data.logo !== undefined ? data.logo : true,
            menu: data.menu !== undefined ? data.menu : true,
            tools: data.tools !== undefined ? data.tools : true
        });*/
    }

    /*toData(): IInterface
    {
        const ins = this.ins;

        return {
            visible: ins.visible.value,
            logo: ins.logo.value,
            menu: ins.menu.value,
            tools: ins.tools.value
        };
    }*/

    protected onPointer(event: IPointerEvent)
    {
        if(this.isPlaying) {
            const renderer = this.renderer.views[0].renderer;
            const buffer = this.pickBuffer;

            renderer.readRenderTargetPixels(this.convTarget, event.localX, window.innerHeight-event.localY, 1, 1, buffer);

            const depth = buffer[3] * 2.337437050015319e-10 
            + buffer[2] * 5.983838848039216e-8 
            + buffer[1] * 1.531862745098039e-5 
            + buffer[0] * 0.003921568627451;

            this.oscillator.frequency.value = depth <= 0.000001 ? 100 : 100 + 1480*(1.0-depth);

            //console.log(event.localX + " " + event.localY + " DEPTH: " + depth);
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
        renderer.setClearColor(0);

        //renderer.setRenderTarget( this.target );
        //renderer.render( scene, camera );

        //this.depthShader.uniforms.tDepth.value = this.target.depthTexture;
        this.depthShader.uniforms.cameraNear.value = camera.near;
        this.depthShader.uniforms.cameraFar.value = camera.far;
        scene.overrideMaterial = this.depthShader;
        renderer.setRenderTarget( this.convTarget );
        renderer.clear();
        renderer.render( scene, camera );
        renderer.setRenderTarget( null );

        renderer.setClearColor(_color);


        //console.log(camera.near + " " + camera.far);

        //renderer.render( scene, camera );

        //camera.setProjection(EProjection.Perspective);

        scene.overrideMaterial = overrideMaterial;

        camera.far = oldFarPlane;
        camera.near = oldNearPlane;
        camera.updateProjectionMatrix();
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
}