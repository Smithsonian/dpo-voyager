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

import Component, { types, IComponentEvent, IUpdateContext } from "@ff/graph/Component";
import { IAudio } from "client/schema/setup";
import CVMeta from "./CVMeta";
import { Dictionary } from "client/../../libs/ff-core/source/types";
import { EActionTrigger, TActionTrigger, EActionType, TActionType } from "client/schema/meta";
import CVAssetManager from "./CVAssetManager";
import CVLanguageManager from "./CVLanguageManager";
import { TLanguageType, ELanguageType } from "client/schema/common";
import Notification from "@ff/ui/Notification";
import CustomElement, { customElement, html, property, PropertyValues } from "@ff/ui/CustomElement";
import CVAnalytics from "./CVAnalytics";
import CVNodeObserver from "./CVNodeObserver";
import NVNode from "client/nodes/NVNode";
import CVModel2 from "./CVModel2";
import { IPointerEvent } from "@ff/scene/RenderView";
import CVAudioManager from "./CVAudioManager";
import { AnimationAction, AnimationClip, AnimationMixer, AnimationObjectGroup, Clock, LoopOnce } from "three";

////////////////////////////////////////////////////////////////////////////////

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
    private _activeClip: AnimationAction = null;

    protected static readonly ins = {
        //playNarration: types.Event("Audio.PlayNarration"),
        //activeCaption: types.String("Audio.ActiveCaption"),
        //captionsEnabled: types.Boolean("Audio.CaptionsEnabled", true),
    };

    protected static readonly outs = {
        //narrationEnabled: types.Boolean("Audio.NarrationEnabled", false),
        //narrationPlaying: types.Boolean("Audio.NarrationPlaying", false),
        //isPlaying: types.Boolean("Audio.IsPlaying", false),
        //updated: types.Event("Audio.Updated")
    };

    ins = this.addInputs(CVActionManager.ins);
    outs = this.addOutputs(CVActionManager.outs);

    protected get assetManager() {
        return this.getMainComponent(CVAssetManager);
    }
    protected get language() {
        return this.getGraphComponent(CVLanguageManager, true);
    }
    protected get analytics() {
        return this.system.getMainComponent(CVAnalytics);
    }
    protected get audio() {
        return this.getGraphComponent(CVAudioManager);
    }

    create()
    {
        super.create();

        this._mixer = new AnimationMixer(null);
        this._mixer.addEventListener( 'finished', function(e) {
            e.action.stop();
        });

        this.system.on<IPointerEvent>("pointer-up", this.onPointerUp, this);
    }

    dispose()
    {
        this.system.off<IPointerEvent>("pointer-up", this.onPointerUp, this);

        super.dispose();
    }

    update()
    {
        const { ins, outs } = this;

        
        return true;
    }

    protected onPointerUp(event: IPointerEvent)
    {
        if (!event.isPrimary || event.isDragging) {
            return;
        }

        if (event.component && event.component.is(CVModel2)) {
            const meta = event.component.node.getComponent(CVMeta);
            if(meta) { 
                const clickActions = meta.actions.items.filter(item => item.trigger == EActionTrigger[EActionTrigger.OnClick] as TActionTrigger);
                if(clickActions.length > 0) {
                    clickActions.forEach((action) => {
                        if(action.type == EActionType[EActionType.PlayAudio] as TActionType) {
                            this.audio.play(action.audioId);
                        }
                        else if(action.type == EActionType[EActionType.PlayAnimation] as TActionType) {
                            const mesh = (event.component as CVModel2).object3D.children[0].children[0];
                            const meshParent = (event.component as CVModel2).object3D.parent;

                            // move animation target to parent so annotations are also affected
                            meshParent.name = mesh.name;
                            mesh.matrixAutoUpdate = false;
                            meshParent.matrixAutoUpdate = true;
                            const clip = this._activeClip = this._mixer.clipAction(AnimationClip.findByName(mesh.animations, action.animation), meshParent);
                            
                            clip.setLoop(LoopOnce, 1);
                            clip.play();
                        }
                    });
                }
            }
        }
    }

    tick() : boolean
    {   
        const delta = this._clock.getDelta();

        if(this._activeClip && this._activeClip.isRunning()) {
            this._mixer.update(delta);
            return true;
        }

        return false;
    }

    /*protected onMetaComponent(event: IComponentEvent<CVMeta>)
    {
        const meta = event.object;

        if (meta.node.typeName === "NVScene" && event.add) {
            this.audioClips = meta.audio.dictionary;  // needed to support initially empty meta nodes
            meta.once("load", () => {
                this.audioClips = meta.audio.dictionary;
                this.outs.updated.set();
                Object.keys(this.audioClips).forEach(key => {
                    this.updateAudioClip(this.audioClips[key].id);
                });
            });
        }
    }

    fromData(data: IAudio)
    {
        const { outs } = this;
        data = data || {} as IAudio;

        this._narrationId = data.narrationId || null;
        outs.narrationEnabled.setValue(this._narrationId != null);

        if(!this.audioClips[this._narrationId]) {
            outs.narrationEnabled.setValue(false);
            console.warn("Invalid narration audio ID");
        }
    }

    toData(): IAudio
    {
        let data: IAudio = null;

        if(this._narrationId !== null) {
            data = {
                narrationId: this._narrationId
            };
        }

        return data;
    }*/
}