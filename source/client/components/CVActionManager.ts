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

import Component, { IComponentEvent, types } from "@ff/graph/Component";
import CVMeta from "./CVMeta";
import { EActionTrigger, TActionTrigger, EActionType, TActionType, EActionPlayStyle, TActionPlayStyle, IAction } from "client/schema/meta";
import CVModel2, { IModelLoadEvent } from "./CVModel2";
import { IPointerEvent } from "@ff/scene/RenderView";
import CVAudioManager from "./CVAudioManager";
import { AnimationAction, AnimationClip, AnimationMixer, AnimationObjectGroup, Clock, LoopOnce, LoopRepeat, Matrix4, Object3D, Quaternion, Vector3 } from "three";
import { Dictionary } from "@ff/core/types";
import { AnnotationElement } from "client/annotations/AnnotationSprite";
import CVViewer from "./CVViewer";
import CVAnnotationView from "./CVAnnotationView";
import CVSnapshots from "./CVSnapshots";
import CVTape from "./CVTape";
import CVSetup from "./CVSetup";

////////////////////////////////////////////////////////////////////////////////

const _vec3a = new Vector3();
const _vec3b = new Vector3();
const _quat = new Quaternion();
const _mat4 = new Matrix4();

/**
 * Component that manages scene actions.
 */
export default class CVActionManager extends Component
{
    static readonly typeName: string = "CVActionManager";

    static readonly text: string = "Actions";
    static readonly icon: string = "";

    static readonly isSystemSingleton = true;

    private _clock: Clock = new Clock();
    private _mixer: AnimationMixer = null;
    private _activeClips: {id: string, clip: AnimationAction}[] = [];
    private _direction: Dictionary<number> = {};
    private _initialOffset: Dictionary<Matrix4> = {};
    private _animGroups: Dictionary<AnimationObjectGroup> = {};
    private _animQueue = [];

    protected static readonly ins = {
        reset: types.Event("Actions.Reset")
    };

    ins = this.addInputs(CVActionManager.ins);

    protected get setup() {
        return this.getGraphComponent(CVSetup);
    }
    protected get viewer() {
        return this.getGraphComponent(CVViewer);
    }

    create()
    {
        super.create();

        this._mixer = new AnimationMixer(null);
        this._mixer.addEventListener( 'finished', (e) => {
            const idx = this._activeClips.findIndex((element) => element.clip === e.action);
            if(idx > -1) {
                this._activeClips.splice(idx,1);
            }
        });

        this.graph.components.on(CVModel2, this.onModelComponent, this);
        this.graph.components.on(CVSnapshots, this.onSnapshotsComponent, this);
        this.system.on<IPointerEvent>("pointer-up", this.onPointerUp, this);
        this.viewer.ins.activeAnnotation.on("value", this.onAnnotationActivate, this);
    }

    dispose()
    {
        this.viewer.ins.activeAnnotation.off("value", this.onAnnotationActivate, this);
        this.system.off<IPointerEvent>("pointer-up", this.onPointerUp, this);
        this.graph.components.off(CVSnapshots, this.onSnapshotsComponent, this);
        this.graph.components.off(CVModel2, this.onModelComponent, this);

        super.dispose();
    }

    update()
    {
        const { ins, outs } = this;

        if (ins.reset.changed) {
            this._mixer.stopAllAction();
            Object.keys(this._direction).forEach(key => delete this._direction[key]);
            this._activeClips.length = 0;
        }
        return true;
    }

    stopAction(action: IAction) {
        if(action.type == EActionType[EActionType.PlayAnimation] as TActionType) {
            const idx = this._activeClips.findIndex((element) => element.id === action.id);    
            if(idx > -1) {
                this._activeClips[idx].clip.stop();
                this._activeClips.splice(idx,1);
            }
        }
    }

    protected onPointerUp(event: IPointerEvent)
    {
        if (!event.isPrimary || event.isDragging || this.setup.tape.ins.enabled.value) {
            return;
        }

        if (event.component && event.component.is(CVModel2)) {
            // Don't allow triggering events through an annotation
            const annotationClick = event.originalEvent.composedPath().slice(0,5).some((elem) => elem instanceof AnnotationElement);
            if(annotationClick) {
                return;
            }
            
            const meta = event.component.node.getComponent(CVMeta, true);
            if(meta) { 
                const clickActions = meta.actions.items.filter(item => item.trigger == EActionTrigger[EActionTrigger.OnClick] as TActionTrigger);
                if(clickActions.length > 0) {
                    clickActions.forEach((action) => {
                        if(action.type == EActionType[EActionType.PlayAudio] as TActionType) {
                            this.setup.audio.play(action.audioId);
                        }
                        else if(action.type == EActionType[EActionType.PlayAnimation] as TActionType) {
                            this.playAnimation(event.component as CVModel2, action);
                        }
                    });
                }
            }
        }
    }

    tick() : boolean
    {   
        const delta = this._clock.getDelta();

        if(this._activeClips.length > 0) {
            this._mixer.update(delta);
            return true;
        }

        return false;
    }

    protected onModelComponent(event: IComponentEvent<CVModel2>)
    {
        const component = event.object;

        if (event.add) {
            component.on<IModelLoadEvent>("model-load", (event) => this.onModelLoad(event, component), this);
        }
        else if (event.remove) {
            component.off<IModelLoadEvent>("model-load", (event) => this.onModelLoad(event, component), this);
        }
    }

    protected onSnapshotsComponent(event: IComponentEvent<CVSnapshots>)
    {
        const component = event.object;

        if (event.add) {
            component.outs.end.on("value", this.onTransitionEnd, this);
        }
        else if (event.remove) {
            component.outs.end.off("value", this.onTransitionEnd, this);
        }
    }

    protected onModelLoad(event: IModelLoadEvent, component: CVModel2)
    {
        const meta = component.node.getComponent(CVMeta, true);
        if(meta) {
            const loadActions = meta.actions.items.filter(item => item.trigger == EActionTrigger[EActionTrigger.OnLoad] as TActionTrigger);
            if(loadActions.length > 0) {
                loadActions.forEach((action) => {
                    this.playAnimation(component as CVModel2, action);
                });
            }
        }
    }

    protected onAnnotationActivate() {
        const id = this.viewer.ins.activeAnnotation.value;

        this.getGraphComponents(CVMeta).forEach((meta) => {
            const actions = meta.actions.items.filter(item => {return id.length > 0 && item.annotationId == id});
            if(actions.length > 0) {
                actions.forEach((action) => {
                    if(action.type == EActionType[EActionType.PlayAnimation] as TActionType) {
                        const model = meta.node.getComponent(CVModel2);
                        const annotation = model.getComponent(CVAnnotationView).getAnnotationById(id);
                        if(annotation.data.viewId) {
                            // Queue up animations for annos that have views so we can chain the transitions
                            this._animQueue.push({model: model, action: action});
                        }
                        else {
                            this.playAnimation(model, action);
                        }
                    }
                });
            }
        });
    }

    protected onTransitionEnd() {
        // Handle playing animations queued up during snapshot tweens
        while(this._animQueue.length > 0) {
            const action = this._animQueue.pop();
            this.playAnimation(action.model, action.action);
        }
    }

    protected playAnimation(component: CVModel2, action: IAction) 
    {
        const mesh = component.object3D.children[0].children[0];
        const meshParent = component.object3D;
        const annotations = component.node.getComponent(CVAnnotationView).object3D;

        //** This is very hacky, but necessary due to the baked nature of annotation transforms.    */
        //** Fixing this would likely mean breaking any backwards compatibility with annotations... */
        {
            // insert new annotation offset nodes
            if(annotations.parent.name !== mesh.name) {
                annotations.parent.add(new Object3D().add(new Object3D().add(annotations)));
                annotations.parent.name = mesh.name;
                annotations.parent.parent.matrixAutoUpdate = false;

                this._initialOffset[mesh.id] = new Matrix4().copy(mesh.matrix);
                this._animGroups[mesh.id] = new AnimationObjectGroup(mesh, annotations.parent);
            } 
            mesh.matrixAutoUpdate = true;   
            // add offset to remove baked transforms
            meshParent.matrix.decompose(_vec3a, _quat, _vec3b);
            _vec3a.multiplyScalar(1/_vec3b.x);
            _vec3b.setScalar(1);
            annotations.matrix.compose(_vec3a, _quat, _vec3b).invert();
            annotations.matrix.multiply(_mat4.copy(this._initialOffset[mesh.id]).invert()) // include potential base mesh offset

            // re-add transforms
            annotations.parent.parent.matrix.copy(meshParent.matrix);
            annotations.parent.parent.matrixWorldNeedsUpdate = true;
        }
        
        const clip = this._mixer.clipAction(AnimationClip.findByName(mesh.animations, action.animation), this._animGroups[mesh.id]);

        if(clip && !clip.isRunning()) {
            clip.reset();
            // handle ping-pong directions
            if(action.style == EActionPlayStyle[EActionPlayStyle.PingPong] as TActionPlayStyle) {
                const clipName = clip.getClip().name;
                clip.clampWhenFinished = true;
                if(Object.keys(this._direction).includes(clipName)) {
                    this._direction[clipName] *= -1;
                    clip.timeScale = this._direction[clipName];
                    clip.time = clip.timeScale > 0 ? 0 : clip.getClip().duration;
                }
                else {
                    this._direction[clipName] = 1;
                }
            }
            else {
                clip.time = 0;
                clip.timeScale = 1;
                clip.clampWhenFinished = false;
            }

            const isLooping = (action.style == EActionPlayStyle[EActionPlayStyle.Loop] as TActionPlayStyle)

            isLooping ? clip.setLoop(LoopRepeat, Infinity) : clip.setLoop(LoopOnce, 1);
            clip.play();
            this._activeClips.some((element) => element.id === action.id) ? null : this._activeClips.push({id: action.id, clip: clip});
        }
    }

    // To save/load future configuration options
    fromData() {}
    toData() { return null; }
}