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

import Component, { types, IComponentEvent } from "@ff/graph/Component";
import { IAudio } from "client/schema/setup";
import CVMeta from "./CVMeta";
import { Dictionary } from "client/../../libs/ff-core/source/types";
import { IAudioClip } from "client/schema/meta";
import CVAssetManager from "./CVAssetManager";
import CVLanguageManager from "./CVLanguageManager";
import { TLanguageType, ELanguageType } from "client/schema/common";
import Notification from "@ff/ui/Notification";

////////////////////////////////////////////////////////////////////////////////

/**
 * Component that manages audio settings and functions.
 */
export default class CVAudioManager extends Component
{
    static readonly typeName: string = "CVAudioManager";

    static readonly text: string = "Audio";
    static readonly icon: string = "";

    static readonly isSystemSingleton = true;

    private _narrationId: string = null;

    protected audioClips: Dictionary<IAudioClip> = {};
    protected audioPlayer: HTMLAudioElement = null;
    protected isPlaying: Boolean = false;

    protected static readonly ins = {
        playNarration: types.Event("Audio.PlayNarration"),
    };

    protected static readonly outs = {
        narrationEnabled: types.Boolean("Audio.NarrationEnabled", false),
        narrationPlaying: types.Boolean("Audio.NarrationPlaying", false),
        updated: types.Event("Audio.Updated")
    };

    ins = this.addInputs(CVAudioManager.ins);
    outs = this.addOutputs(CVAudioManager.outs);

    protected get assetManager() {
        return this.getMainComponent(CVAssetManager);
    }
    protected get language() {
        return this.getGraphComponent(CVLanguageManager, true);
    }

    get narrationId() {
        return this._narrationId || "";
    }
    set narrationId( id: string ) {
        this._narrationId = id;
        this.outs.narrationEnabled.setValue(id.length > 0);
    }

    create()
    {
        super.create();
        this.graph.components.on(CVMeta, this.onMetaComponent, this);
    }

    dispose()
    {
        this.graph.components.off(CVMeta, this.onMetaComponent, this);
        super.dispose();
    }

    update()
    {
        const { ins, outs } = this;

        if (ins.playNarration.changed) {
            if(this.audioPlayer && this._narrationId) {
                if(!this.isPlaying) {
                    this.play(this._narrationId);
                }
                else {
                    this.stop();
                }
            }
        }
    
        return true;
    }

    getAudioList()
    {
        return Object.keys(this.audioClips).map(key => this.audioClips[key]);
    }

    getAudioClip(id: string) {
        return this.audioClips[id];
    }

    getAudioClipUri(id: string) {
        const clip = this.audioClips[id];
        return clip ? clip.uris[ELanguageType[this.language.outs.language.value]] : null;
    }

    addAudioClip(clip: IAudioClip)
    {
        this.audioClips[clip.id] = clip;
        this.outs.updated.set();
    }

    removeAudioClip(id: string)
    {
        if(id == this._narrationId) {
            if(this.isPlaying) {
                this.stop();
            }
            this.narrationId = "";
        }
        delete this.audioClips[id];
    }

    updateAudioClip(id: string)
    {
        this.outs.updated.set();
    }

    protected onMetaComponent(event: IComponentEvent<CVMeta>)
    {
        const meta = event.object;

        if (meta.node.typeName === "NVScene" && event.add) {
            this.audioClips = meta.audio.dictionary;  // needed to support initially empty meta nodes
            meta.once("load", () => {
                this.audioClips = meta.audio.dictionary;
                this.outs.updated.set();
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
    }

    play(id: string)
    {
        if(!this.audioPlayer) {
            // Audio player not initialized. Need to call setupAudio() from a click handler to support all browsers.
            Notification.show(`Error - Audio Player not initialized.`, "error");
            return;
        }

        const { outs } = this;
        const clip = this.audioClips[id];
        const uri = clip.uris[ELanguageType[this.language.outs.language.getValidatedValue()] as TLanguageType];
        
        this.audioPlayer.setAttribute("src", this.assetManager.getAssetUrl(uri));
        this.audioPlayer.play()
        .then(() => {
            this.isPlaying = true;
            //outs.narrationPlaying.setValue(id === this._narrationId);
            outs.narrationPlaying.setValue(true);
        })
        .catch(error => Notification.show(`Failed to play audio at '${this.audioPlayer.getAttribute("src")}':${error}`, "warning"));  
    }

    stop()
    {      
        this.audioPlayer.pause();
        this.audioPlayer.currentTime = 0;
        this.onEnd();
    }

    protected onEnd = () => {
        const { outs } = this;

        this.isPlaying = false;
        outs.narrationPlaying.setValue(false);
    }

    // setup function required for Safari compatibility so audio element is setup immediately on user interaction.
    setupAudio()
    {
        if(this.audioPlayer === null) {
            this.audioPlayer = document.createElement('audio');
            this.audioPlayer.onended = this.onEnd;
            //this.audioPlayer.src = "data:audio/mpeg;base64,SUQzBAAAAAABEVRYWFgAAAAtAAADY29tbWVudABCaWdTb3VuZEJhbmsuY29tIC8gTGFTb25vdGhlcXVlLm9yZwBURU5DAAAAHQAAA1N3aXRjaCBQbHVzIMKpIE5DSCBTb2Z0d2FyZQBUSVQyAAAABgAAAzIyMzUAVFNTRQAAAA8AAANMYXZmNTcuODMuMTAwAAAAAAAAAAAAAAD/80DEAAAAA0gAAAAATEFNRTMuMTAwVVVVVVVVVVVVVUxBTUUzLjEwMFVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVf/zQsRbAAADSAAAAABVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVf/zQMSkAAADSAAAAABVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVV";

            //this.ins.playNarration.set();
        }
    }
}