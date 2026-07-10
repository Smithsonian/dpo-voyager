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
import { AnimationAction, AnimationClip, AnimationMixer, AnimationObjectGroup, Clock, LoopOnce, LoopRepeat, Matrix4, Object3D, Quaternion, Vector3 } from "three";
import { Dictionary } from "@ff/core/types";
import { Annotation, AnnotationElement } from "client/annotations/AnnotationSprite";
import CVAnnotationView from "./CVAnnotationView";
import CVSnapshots from "./CVSnapshots";
import CVSetup from "./CVSetup";
import CVScene from "./CVScene";
import CVTours from "./CVTours";

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
    private _animMap: Dictionary<Object3D> = {};
    private _animGroups: Dictionary<AnimationObjectGroup> = {};
    private _actions: {model: CVModel2, action: IAction}[] = [];
    private _visibilityCache: {annotation: Annotation, visibility: boolean}[] = [];

    private _animQueue = [];

    protected static readonly ins = {
        reset: types.Event("Actions.Reset")
    };

    ins = this.addInputs(CVActionManager.ins);

    protected get setup() {
        return this.getGraphComponent(CVSetup);
    }
    protected get viewer() {
        return this.setup.viewer;
    }
    protected get tours() {
        return this.getGraphComponent(CVTours);
    }
    protected get sceneNode() {
        return this.getSystemComponent(CVScene);
    }

    create()
    {
        super.create();

        this._mixer = new AnimationMixer(null);
        this._mixer.addEventListener( 'finished', (e) => {
            const idx = this._activeClips.findIndex((element) => element.clip === e.action);
            const finishedId = this._activeClips[idx].id;
            if(idx > -1) {
                this._activeClips.splice(idx,1);
            }

            // trigger scene bounds recalculation if needed
            if(e.action.clampWhenFinished) {
                this.sceneNode.ins.sceneTransformed.set();
            }

            // fire onEnd triggers
            const onEndTriggers = this._actions.filter(element => element.action.trigger === EActionTrigger[EActionTrigger.OnActionEnd] as TActionTrigger
                && element.action.triggerDetail === finishedId);
            onEndTriggers.forEach(trigger => this.playAction(trigger.model, trigger.action));
        });

        this.graph.components.on(CVModel2, this.onModelComponent, this);
        this.graph.components.on(CVSnapshots, this.onSnapshotsComponent, this);
        this.system.on<IPointerEvent>("pointer-up", this.onPointerUp, this);
        this.viewer.ins.activeAnnotation.on("value", this.onAnnotationActivate, this);
        this.viewer.outs.sceneLoaded.on("value", this.onSceneLoad, this);
        this.tours.outs.stepIndex.on("value", this.onTourStep, this);
    }

    dispose()
    {
        this.tours.outs.stepIndex.off("value", this.onTourStep, this);
        this.viewer.outs.sceneLoaded.off("value", this.onSceneLoad, this);
        this.viewer.ins.activeAnnotation.off("value", this.onAnnotationActivate, this);
        this.system.off<IPointerEvent>("pointer-up", this.onPointerUp, this);
        this.graph.components.off(CVSnapshots, this.onSnapshotsComponent, this);
        this.graph.components.off(CVModel2, this.onModelComponent, this);

        this._clock = null;
        this._mixer = null;
        this._actions.length = 0;
        this._visibilityCache.length = 0;
        
        super.dispose();
    }

    update()
    {
        const { ins, outs } = this;

        if (ins.reset.changed) {
            this._mixer.stopAllAction();
            Object.keys(this._direction).forEach(key => delete this._direction[key]);
            this._activeClips.length = 0;

            // reset visibilities
            this._visibilityCache.forEach(anno => anno.annotation.set("visible", anno.visibility));

            // retrigger scene load actions
            this.onSceneLoad();
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

    refreshActions() {
        this._actions.length = 0;
        this.getSystemComponents(CVMeta).forEach((meta) => {
            const model = meta.node.getComponent(CVModel2, true);
            if(model) {
                this._actions.push(...(meta.actions.items.map(action => ({model: model, action: action}))));
            }
        });
    }

    getSyncTime(id: string) : number {
        const audioAction = this._actions.find(element => element.action.audioId === id)?.action;
        const action = this._activeClips.find(element => element.clip.getClip().name === audioAction.syncWith);
        return action === undefined ? undefined : action.clip.time;
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
                        this.playAction(event.component as CVModel2, action);
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
        // Initialize animation map
        const model = component.node.getComponent(CVModel2, true)
        model.object3D.traverse(object => {
            if (object.animations.length > 0) {
                object.animations.forEach((anim) => {
                    this._animMap[anim.name] = object;
                })
            }
        });
    }

    protected onSceneLoad() 
    {
        this._visibilityCache.length = 0;
        this.getGraphComponents(CVModel2).forEach((model) => {
            
            const meta = model.node.getComponent(CVMeta, true);
            if(meta) {
                // Start onload animations
                const loadActions = meta.actions.items.filter(item => item.trigger == EActionTrigger[EActionTrigger.OnLoad] as TActionTrigger);
                if(loadActions.length > 0) {
                    loadActions.forEach((action) => {
                        if(action.type !== EActionType[EActionType.PlayAudio] as TActionType) {
                            this.playAction(model, action);
                        }
                    });
                }

                // Cache annotation visibility
                meta.actions.items.forEach((action) => {
                    if(action.type == EActionType[EActionType.ShowAnnotation] as TActionType
                        || action.type == EActionType[EActionType.HideAnnotation] as TActionType
                        || action.type == EActionType[EActionType.ToggleAnnotation] as TActionType) {
                        const annotation = model.getComponent(CVAnnotationView).getAnnotationById(action.actionAnnoId);
                        if(annotation) {
                            this._visibilityCache.push({annotation: annotation, visibility: annotation.data.visible});
                        }
                    }
                });
            }
        });

        this.refreshActions();
    }

    protected onAnnotationActivate() 
    {
        const id = this.viewer.ins.activeAnnotation.value;

        if(id.length === 0 || this.ins.reset.changed) {
            return;
        }

        this.getGraphComponents(CVMeta).forEach((meta) => {
            const actions = meta.actions.items.filter(item => {return id.length > 0 && item.annotationId == id});
            if(actions.length > 0) {
                actions.forEach((action) => {
                    if(action.type == EActionType[EActionType.PlayAudio] as TActionType) {
                        this.playAction(null, action);
                    }
                    else {
                        const model = meta.node.getComponent(CVModel2);
                        const annotation = model.getComponent(CVAnnotationView).getAnnotationById(id);
                        if(annotation.data.viewId) {
                            // Queue up animations for annos that have views so we can chain the transitions
                            this._animQueue.push({model: model, action: action});
                        }
                        else {
                            this.playAction(model, action);
                        }
                    }
                });
            }
        });
    }

    protected onTourStep() 
    {
        if(this.tours.activeTour) {
            // Set any currently active or queued animations to their finish state
            while(this._animQueue.length > 0) {
                const action = this._animQueue.pop();
                this.playAction(action.model, action.action);
            }
            this._activeClips.forEach(item => {
                item.clip.time = item.clip.timeScale > 0 ? item.clip.getClip().duration : 0;
            });

            const tour = this.tours.title;                  // DEPRECATED SUPPORT - REMOVE IN v0.64
            const step = this.tours.outs.stepIndex.value;   // DEPRECATED SUPPORT - REMOVE IN v0.64

            const stepId = this.tours.activeStep?.id;
            
            this.getGraphComponents(CVMeta).forEach((meta) => {
                const actions = meta.actions.items.filter(action => {return action.trigger === EActionTrigger[EActionTrigger.OnTourStep] as TActionTrigger
                    && ((action.triggerDetail?.split("\x1F")[0] === tour && action.triggerDetail?.split("\x1F")[1] === (step+1).toString())  // DEPRECATED SUPPORT - REMOVE IN v0.64
                    || action.triggerDetail === stepId)
                });
                if(actions.length > 0) {
                    actions.forEach((action) => {
                        if(action.type !== EActionType[EActionType.PlayAudio] as TActionType) {
                            const model = meta.node.getComponent(CVModel2);
                            this._animQueue.push({model: model, action: action});
                        }
                        /*else if(action.type == EActionType[EActionType.PlayAudio] as TActionType) {
                            this.setup.audio.play(action.audioId, true);
                        }*/
                    });
                }
            });
        }
    }

    protected onTransitionEnd() 
    {
        // Handle playing animations queued up during snapshot tweens
        while(this._animQueue.length > 0) {
            const action = this._animQueue.pop();
            this.playAction(action.model, action.action);
        }
    }

    protected playAction(model: CVModel2, action: IAction)
    {
        // Don't allow user-facing triggers during a tour
        if(this.setup.tours.ins.enabled.value &&
            (action.trigger == EActionTrigger[EActionTrigger.OnClick] as TActionTrigger ||
            action.trigger == EActionTrigger[EActionTrigger.OnAnnotation] as TActionTrigger)) {
            return;
        }

        if(action.type == EActionType[EActionType.PlayAudio] as TActionType) {
            this.setup.audio.play(action.audioId, true);
        }
        else if(action.type == EActionType[EActionType.PlayAnimation] as TActionType) {
            // Don't retrigger looping actions
            if(action.style === EActionPlayStyle[EActionPlayStyle.Loop] as TActionPlayStyle &&
                this._activeClips.some(clip => clip.id === action.id)) {
                return;
            }

            this.playAnimation(model, action);
        }
        else if(action.type == EActionType[EActionType.HideAnnotation] as TActionType ||
            action.type == EActionType[EActionType.ShowAnnotation] as TActionType ||
            action.type == EActionType[EActionType.ToggleAnnotation] as TActionType) {
            this.setAnnotationVisibility(model, action);
        }

        // fire onBegin triggers
        const onBeginTriggers = this._actions.filter(element => element.action.trigger === EActionTrigger[EActionTrigger.OnActionBegin] as TActionTrigger
            && element.action.triggerDetail === action.id);
        onBeginTriggers.forEach(trigger => this.playAction(trigger.model, trigger.action));
    }


    protected playAnimation(component: CVModel2, action: IAction) 
    {
        const mesh = this._animMap[action.animation];

        if(!mesh) {
            console.warn("No playable animation found!");
            return;
        }

        const groupId = mesh.id+action.id;
        const meshParent = component.object3D;
        const annotations = component.node.getComponent(CVAnnotationView).object3D;

        //** This is very hacky, but necessary due to the baked nature of annotation transforms.    */
        //** Fixing this would likely mean breaking any backwards compatibility with annotations... */
        {
            // insert new annotation offset nodes
            if(!this._initialOffset[mesh.id]) {
                annotations.parent.add(new Object3D().add(new Object3D().add(annotations)));
                annotations.parent.name = mesh.name;
                annotations.parent.parent.matrixAutoUpdate = false;

                // initialize as we can't assume that all channels are animated
                annotations.parent.position.copy(mesh.position);
                annotations.parent.rotation.copy(mesh.rotation);

                this._initialOffset[mesh.id] = new Matrix4().copy(mesh.matrix);        
            }
            if(!this._animGroups[groupId]) {
                this._animGroups[groupId] = new AnimationObjectGroup(mesh, annotations.parent);
            }
            mesh.matrixAutoUpdate = true;

            // add offset to remove baked transforms
            meshParent.matrix.decompose(_vec3a, _quat, _vec3b);
            _vec3a.multiplyScalar(1/_vec3b.x);
            _vec3b.setScalar(1);
            annotations.matrix.compose(_vec3a, _quat, _vec3b).invert();
            annotations.matrix.premultiply(_mat4.copy(this._initialOffset[mesh.id]).invert()) // include potential base mesh offset

            // re-add transforms
            annotations.parent.parent.matrix.copy(meshParent.matrix);
            annotations.parent.parent.matrixWorldNeedsUpdate = true;
        }
        
        const clip = this._mixer.clipAction(AnimationClip.findByName(mesh.animations, action.animation), this._animGroups[groupId]);

        if(clip && !clip.isRunning()) {
            clip.reset();
            // handle ping-pong directions
            if(action.style == EActionPlayStyle[EActionPlayStyle.PingPong] as TActionPlayStyle) {
                const clipName = clip.getClip().name;
                clip.clampWhenFinished = true;
                if(Object.keys(this._direction).includes(clipName)) {
                    this._direction[clipName] *= -1;
                }
                else {
                    this._direction[clipName] = 1;
                }
                clip.timeScale = this._direction[clipName] * action.speed;
                clip.time = clip.timeScale > 0 ? 0 : clip.getClip().duration;
            }
            else {
                clip.time = action.speed < 0 ? clip.getClip().duration : 0;
                clip.timeScale = action.speed;
                clip.clampWhenFinished = action.clamp;
            }

            const isLooping = (action.style == EActionPlayStyle[EActionPlayStyle.Loop] as TActionPlayStyle)

            isLooping ? clip.setLoop(LoopRepeat, Infinity) : clip.setLoop(LoopOnce, 1);
            clip.play();
            this._activeClips.some((element) => element.id === action.id) ? null : this._activeClips.push({id: action.id, clip: clip});
        }
    }

    protected setAnnotationVisibility(model: CVModel2, action: IAction)
    {
        const annotation = model.getComponent(CVAnnotationView).getAnnotationById(action.actionAnnoId);

        if(annotation) {
            const isVisible = action.type == EActionType[EActionType.ToggleAnnotation] as TActionType ?
                !annotation.data.visible : action.type == EActionType[EActionType.ShowAnnotation] as TActionType;
            annotation?.set("visible", isVisible);
        }
    }

    // To save/load future configuration options
    fromData() {}
    toData() { return null; }
}