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
import CustomElement, { customElement, html, property, PropertyValues } from "@ff/ui/CustomElement";

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
    private _audioMap: Dictionary<string> = {};

    protected audioClips: Dictionary<IAudioClip> = {};
    protected audioPlayer: HTMLAudioElement = null;
    protected audioView: AudioView = null;
    protected isPlaying: Boolean = false;

    protected static readonly ins = {
        playNarration: types.Event("Audio.PlayNarration"),
        activeCaption: types.String("Audio.ActiveCaption"),
        captionsEnabled: types.Boolean("Audio.CaptionsEnabled", true),
    };

    protected static readonly outs = {
        narrationEnabled: types.Boolean("Audio.NarrationEnabled", false),
        narrationPlaying: types.Boolean("Audio.NarrationPlaying", false),
        isPlaying: types.Boolean("Audio.IsPlaying", false),
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

        this.audioView = new AudioView;
        this.audioView.audio = this;

        this.language.outs.language.on("value", this.onLanguageChange, this);
    }

    dispose()
    {
        // Clean up cached audio files
        Object.keys(this._audioMap).forEach(( key ) => URL.revokeObjectURL( this._audioMap[key] ));

        this.language.outs.language.off("value", this.onLanguageChange, this);
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

    getPlayerById(id: string) {
        this.audioView.audioId = id;
        this.audioView.requestUpdate();
        return this.audioView;
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

    getClipCaptionUri(id: string) {
        const clip = this.audioClips[id];
        return clip ? clip.captionUris[ELanguageType[this.language.outs.language.value]] : null;
    }

    getDuration(id: string) {
        const clip = this.audioClips[id];
        const language = ELanguageType[this.language.outs.language.getValidatedValue()] as TLanguageType;
        const cachedDuration = clip.durations[language];
        if(cachedDuration) {
            return cachedDuration;
        }
        else {
            const clip = this.audioClips[id];
            const uri = clip.uris[language];
            if(uri) {
                const absUri = this.assetManager.getAssetUrl(uri);
                clip.durations[language] = "pending";

                const audioContext = new (window.AudioContext || window.webkitAudioContext)();
                const request = new XMLHttpRequest();
                request.open('GET', absUri, true);
                request.responseType = 'arraybuffer';
                request.onload = () => {
                    const blob = new Blob([request.response], { type: "audio/mpeg" });
                    const url = window.URL.createObjectURL(blob);
                    this._audioMap[uri] = url;
                    audioContext.decodeAudioData(request.response,
                        (buffer) => {
                            let duration = buffer.duration;
                            clip.durations[language] = duration.toString();
                            this.audioView.requestUpdate();                      
                        }
                    )
                }
                request.send();
            }

            return "pending";
        }
    }

    getTimeElapsed() {
        if(this.audioPlayer) {
            return Math.floor(this.audioPlayer.currentTime);
        }
        else {
            return 0;
        }
    }

    setTimeElapsed(time: number) {
        if(this.audioPlayer) { 
            if(this.audioPlayer.seekable.length === 0) {
                this.audioPlayer.addEventListener("canplay",() => this.setTimeElapsed(time), {once: true});
            }      
            else {
                //console.log(this.audioPlayer.seekable.start(0)+" "+this.audioPlayer.seekable.end(0));
                this.audioPlayer.currentTime = time;
                this.audioView.elapsed = time;
                this.audioView.requestUpdate();
            }
        }
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
        this.getDuration(id);
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
    }

    play(id: string)
    {
        const { outs } = this;
        outs.isPlaying.setValue(true);

        this.initializeClip(id);
        
        this.audioPlayer.play()
        .then(() => {
            this.isPlaying = true;
            outs.narrationPlaying.setValue(id === this._narrationId);
            this.audioView.requestUpdate();
        })
        .catch(error => Notification.show(`Failed to play audio at '${this.audioPlayer.getAttribute("src")}':${error}`, "warning"));
    }

    pause()
    {
        if(!this.audioPlayer) {
            return;
        } 
        this.outs.isPlaying.setValue(false);
        this.audioPlayer.pause();
        this.audioView.requestUpdate();
    }

    stop()
    {  
        if(!this.audioPlayer) {//Notification.show(`PLAYINGA`, "warning");
            return;
        }    
        this.pause();
        this.setTimeElapsed(0);
        this.onEnd();
    }

    protected onEnd = () => {
        const { outs } = this;
        
        this.isPlaying = false;
        outs.narrationPlaying.setValue(false);
        this.audioView.requestUpdate();
    }

    // Initialize player for a specific audio clip
    initializeClip(id: string) {
        if(this.audioPlayer === null) {
            this.setupAudio();
        }

        const clip = this.audioClips[id];
        if(clip) {
            const uri = clip.uris[ELanguageType[this.language.outs.language.getValidatedValue()] as TLanguageType];
            const absUri = this.assetManager.getAssetUrl(uri);
            if(this.audioPlayer.src != this._audioMap[uri]) {
                this.audioPlayer.setAttribute("src", this._audioMap[uri]);
                this.audioPlayer.load();
                
                // Set caption track source
                this.audioPlayer.children[0].setAttribute("src", "");
                const captionUri = clip.captionUris[ELanguageType[this.language.outs.language.getValidatedValue()] as TLanguageType];
                if(captionUri) {
                    this.audioPlayer.children[0].setAttribute("src", this.assetManager.getAssetUrl(captionUri));
                }
            }
        }
    }

    // setup function required for Safari compatibility so audio element is setup immediately on user interaction.
    setupAudio()
    {
        if(this.audioPlayer === null) {
            const audio = this.audioPlayer = document.createElement('audio');
            audio.onended = this.onEnd;
            audio.setAttribute("controls", "");
            audio.setAttribute("preload", "auto");
            audio.addEventListener("timeupdate", this.onTimeChange)

            audio.onerror = () => {
                console.error(
                  `Error ${audio.error.code}; details: ${audio.error.message}`,
                );
            };

            // add empty caption track
            const track = document.createElement('track');
            track.setAttribute("default", "");
            this.audioPlayer.append(track);
            track.addEventListener("cuechange", this.onCueChange);
        }
    }

    // Handle caption cue changes
    protected onCueChange = (event: Event) =>
    {
        const activeCues = (event.target as HTMLTrackElement).track.activeCues;
        const activeText = activeCues.length > 0 ? (activeCues[0] as VTTCue).text : "";
        this.ins.activeCaption.setValue(activeText);
    }

    // Handle audio time elapsed updates
    protected onTimeChange = (event: Event) =>
    {
        this.audioView.elapsed = this.getTimeElapsed();
        this.audioView.requestUpdate();
    }

    protected onLanguageChange() {
        this.stop();
    }
}


@customElement("sv-audio-view")
export class AudioView extends CustomElement
{
    @property({ attribute: false })
    audio: CVAudioManager = null;

    @property({ attribute: false })
    audioId: string = "";

    @property({ attribute: false })
    elapsed: number = 0;

    constructor()
    {
        super();

        this.onDrag = this.onDrag.bind(this);
    }

    protected firstConnected()
    {
        this.classList.add("sv-audio-view");
    }

    protected update(changedProperties: PropertyValues): void 
    {
        if (changedProperties.has("elapsed")) {
            const slider = this.querySelector("#time-slider") as HTMLInputElement;
            if(slider) {
                slider.value = this.elapsed.toString();
            }
        }

        super.update(changedProperties);
    }

    protected render()
    {
        //const elapsed = this.audio.getTimeElapsed();
        const duration = this.audio.getDuration(this.audioId);
        const elapsedStr = this.formatSeconds(this.elapsed);
        const durationStr = duration == "pending" ? duration : this.formatSeconds(parseInt(duration));
        return html`<ff-button icon="${this.audio.outs.isPlaying.value ? "pause" : "triangle-right"}" @pointerdown=${(e) => this.playAudio(e, this.audioId)}></ff-button><div class="sv-timer">${elapsedStr}/${durationStr}</div><input id="time-slider" @pointerdown=${this.onDrag} @change=${this.onTimeChange} type="range" min="0" max="${duration}" value="${this.elapsed}" class="slider">`;
    }

    protected playAudio(event: MouseEvent, id: string) {
        const audio = this.audio;

        if(!audio.outs.isPlaying.value) {
            audio.play(id);
        }
        else {
            audio.pause();
        }
    }

    protected onDrag(event: MouseEvent) {
        event.stopPropagation();
    }

    protected onTimeChange() {
        this.audio.initializeClip(this.audioId);
        this.audio.setTimeElapsed(parseFloat((this.querySelector("#time-slider") as HTMLInputElement).value) | 0);
    }

    // Format seconds in friendlier datetime-like string
    protected formatSeconds(seconds: number) {
        var date = new Date(0);
        date.setSeconds(seconds);
        var formatString = date.toISOString().substring(15, 19);
        return formatString;
    }
}