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
import CVAnalytics from "./CVAnalytics";
import CVAnnotationView from "./CVAnnotationView";
import CVActionManager from "./CVActionManager";

////////////////////////////////////////////////////////////////////////////////

interface IAudioDurationLoad {
    uri: string;
    /** In seconds, NaN while unknown. */
    duration: number;
    /** Why the request failed. Play retries it. */
    error: Error;
    controller: AbortController;
    /** Reads the file's metadata, while the request is pending. */
    element: HTMLAudioElement;
    cleanup: () => void;
}

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
    private _activeId: string = null;
    private _playerUri: string = null;
    private _playRequest = 0;
    private _useDefaultPlayer = false;
    private _pendingSeek: () => void = null;
    private _durationLoads = new Map<IAudioClip, Map<string, IAudioDurationLoad>>();

    protected audioClips: Dictionary<IAudioClip> = {};
    protected audioPlayer: HTMLAudioElement = null;
    protected audioView: AudioView = null;
    protected audioViews: Dictionary<AudioView> = {};
    protected isPlaying: Boolean = false;

    protected static readonly ins = {
        playNarration: types.Event("Audio.PlayNarration"),
        reset: types.Event("Audio.Reset"),
        activeCaption: types.String("Audio.ActiveCaption"),
        captionsEnabled: types.Boolean("Audio.CaptionsEnabled", true),
    };

    protected static readonly outs = {
        narrationEnabled: types.Boolean("Audio.NarrationEnabled", false),
        narrationPlaying: types.Boolean("Audio.NarrationPlaying", false),
        globalPlaying: types.Boolean("Audio.NarrationPlaying", false),  // an audio clip isplaying requiring the global player UI
        isPlaying: types.Boolean("Audio.IsPlaying", false),
        updated: types.Event("Audio.Updated")
    };

    ins = this.addInputs(CVAudioManager.ins);
    outs = this.addOutputs(CVAudioManager.outs);

    protected get assetManager() {
        return this.getMainComponent(CVAssetManager);
    }
    protected get actions() {
        return this.getGraphComponent(CVActionManager);
    }
    protected get language() {
        return this.getGraphComponent(CVLanguageManager, true);
    }
    protected get analytics() {
        return this.system.getMainComponent(CVAnalytics);
    }

    get narrationId() {
        return this._narrationId || "";
    }
    set narrationId( id: string ) {
        this._narrationId = id;
        this.outs.narrationEnabled.setValue(id.length > 0);
    }
    get activeId() {
        return this._activeId || "";
    }
    set activeId( id: string ) {
        this._activeId = id;
    }

    create()
    {
        super.create();
        this.graph.components.on(CVMeta, this.onMetaComponent, this);

        this.language.outs.activeLanguage.on("value", this.onLanguageChange, this);
    }

    dispose()
    {
        // Nothing pending is left to act on: playback requests are superseded, duration requests
        // aborted, and releasing the player drops the events it had queued.
        this.releasePlayer();
        this._durationLoads.forEach(loads => loads.forEach(entry => entry.controller.abort()));
        this._durationLoads.clear();

        this.language.outs.activeLanguage.off("value", this.onLanguageChange, this);
        this.graph.components.off(CVMeta, this.onMetaComponent, this);

        super.dispose();
    }

    update()
    {
        const { ins, outs } = this;

        if (ins.playNarration.changed) {
            if(this.audioPlayer && this._narrationId) {
                if(outs.narrationPlaying.value && this.activeId == this._narrationId) {
                    this.stop();
                    outs.narrationPlaying.setValue(false);
                    outs.globalPlaying.setValue(false);
                }
                else if(!outs.narrationPlaying.value){
                    this.play(this._narrationId);
                }
            }
        }
        if (ins.reset.changed) {
            this.stop();
            outs.narrationPlaying.setValue(false);
            outs.globalPlaying.setValue(false);
        }

        return true;
    }

    getPlayerById(id: string) {
        if(!this.audioViews.hasOwnProperty(id)) {
            const view = this.audioViews[id] = new AudioView;
            view.audio = this;
            view.audioId = id;
            view.requestUpdate();
        }

        this.loadDuration(id);
        return this.audioViews[id];
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
        return clip ? clip.uris[ELanguageType[this.language.outs.activeLanguage.value]] : null;
    }

    getClipCaptionUri(id: string) {
        const clip = this.audioClips[id];
        return clip ? clip.captionUris[ELanguageType[this.language.outs.activeLanguage.value]] : null;
    }

    /** The clip's duration in seconds, NaN while unknown, as for media elements. Starts no request. */
    getDuration(id: string): number {
        if (!this.node) {
            return NaN; // views can still render once their manager is disposed
        }
        return this.durationLoad(id)?.duration ?? NaN;
    }

    /** The duration request for the clip's file in the active language, if any. */
    private durationLoad(id: string): IAudioDurationLoad {
        const clip = this.audioClips[id];
        const language = ELanguageType[this.language.outs.activeLanguage.getValidatedValue()];
        const entry = this._durationLoads.get(clip)?.get(language);
        return entry && entry.uri === clip.uris[language] ? entry : null;
    }

    /** Requests metadata for a displayed player, without downloading and decoding the whole file. */
    loadDuration(id: string, { retry = false }: { retry?: boolean } = {}) {
        const clip = this.audioClips[id];
        const language = ELanguageType[this.language.outs.activeLanguage.getValidatedValue()];
        const uri = clip?.uris[language];
        if (!uri) {
            return;
        }

        let entries = this._durationLoads.get(clip);
        if (!entries) {
            this._durationLoads.set(clip, entries = new Map());
        }
        const previous = entries.get(language);
        if (previous?.uri === uri && (!previous.error || !retry)) {
            return;
        }
        previous?.controller.abort(new DOMException("Superseded by another audio file", "AbortError"));

        const element = document.createElement("audio");
        element.preload = "metadata";
        element.crossOrigin = "anonymous";
        const entry: IAudioDurationLoad = { uri, duration: NaN, error: null, controller: null, element, cleanup: null };
        entries.set(language, entry);
        const { signal } = entry.controller = new AbortController();
        const current = () => !signal.aborted && this.audioClips[id] === clip
            && clip.uris[language] === uri && entries.get(language) === entry;
        const metadata = () => {
            if (current()) {
                this.finishDuration(id, entry, element.duration);
            }
        };
        const failed = () => {
            if (current()) {
                this.finishDuration(id, entry, NaN, this.mediaError(uri, element.error));
            }
        };
        const cleanup = entry.cleanup = () => {
            element.removeEventListener("loadedmetadata", metadata);
            element.removeEventListener("error", failed);
            signal.removeEventListener("abort", cleanup);
            element.removeAttribute("src");
            element.load();
            entry.element = null;
            entry.cleanup = () => {};
        };
        signal.addEventListener("abort", cleanup, { once: true });
        element.addEventListener("loadedmetadata", metadata);
        element.addEventListener("error", failed);
        element.src = this.assetManager.getAssetUrl(uri);
    }

    private mediaError(uri: string, error: MediaError): Error {
        const names = { 1: "AbortError", 2: "NetworkError", 3: "EncodingError", 4: "NotSupportedError" };
        return new DOMException(`Failed to load audio at '${uri}': ${error?.message
            || "media error " + error?.code}`, names[error?.code] || "MediaError");
    }

    private finishDuration(id: string, entry: IAudioDurationLoad, duration: number, error: Error = null) {
        entry.duration = Number.isFinite(duration) && duration >= 0 ? duration : NaN;
        entry.error = error;
        entry.cleanup();
        if (error) {
            console.error(error);
        }
        this.audioViews[id]?.requestUpdate();
        this.updateGlobalPlayer();
    }

    /** Playback can provide metadata even when the browser declines preloading it. */
    protected onPlaybackDuration = () => {
        const id = this.audioView?.audioId;
        const entry = this.durationLoad(id);
        const player = this.audioPlayer;
        if (entry && this._playerUri === this.assetManager.getAssetUrl(entry.uri)
            && (!player.currentSrc || player.currentSrc === player.src)
            && Number.isFinite(player.duration) && player.duration >= 0) {
            this.finishDuration(id, entry, player.duration);
        }
    }

    getTimeElapsed() {
        if(this.audioPlayer) {
            return Math.round(this.audioPlayer.currentTime * Math.pow(10, 3)) / Math.pow(10, 3);
        }
        else {
            return 0;
        }
    }

    setTimeElapsed(time: number) {
        if (!Number.isFinite(time) || time < 0) {
            return;
        }
        if(this.audioPlayer && this.audioView) { 
            this.clearPendingSeek();
            if(this.audioPlayer.seekable.length === 0) {
                const uri = this._playerUri;
                const view = this.audioView;
                this._pendingSeek = () => {
                    this._pendingSeek = null;
                    if (this._playerUri === uri && this.audioView === view) {
                        this.setTimeElapsed(time);
                    }
                };
                this.audioPlayer.addEventListener("canplay", this._pendingSeek, { once: true });
            }      
            else {
                this.audioPlayer.currentTime = time;
                this.audioView.elapsed = time;
                this.audioView.requestUpdate();
            }
        }
    }

    private clearPendingSeek() {
        if (this._pendingSeek) {
            this.audioPlayer?.removeEventListener("canplay", this._pendingSeek);
            this._pendingSeek = null;
        }
    }

    /** Stops playback and lets the browser release the file. */
    private releasePlayer() {
        if (!this.audioPlayer) {
            return;
        }
        this.stop();
        this.clearPendingSeek();
        this.audioPlayer.removeAttribute("src");
        this.audioPlayer.load();
        this._playerUri = null;
    }

    addAudioClip(clip: IAudioClip)
    {
        this.audioClips[clip.id] = clip;
        this.outs.updated.set();
    }

    removeAudioClip(id: string)
    {
        if(id === this.activeId || this.audioView?.audioId === id) {
            this.releasePlayer();
            this.activeId = null;
            this.audioView = null;
        }
        const clip = this.audioClips[id];
        this._durationLoads.get(clip)?.forEach(entry => entry.controller.abort());
        this._durationLoads.delete(clip);
        delete this.audioViews[id];

        // check for audio ids in annotations
        const views = this.system.getComponents(CVAnnotationView); 
        views.forEach(component => {
            component.getAnnotations().forEach(annotation => {
                if(annotation.data.audioId === id) {
                    annotation.set("audioId", "");
                    component.updateAnnotation(annotation);
                }
            });
        });

        if(id == this._narrationId) {
            this.narrationId = "";
        }
        delete this.audioClips[id];
    }

    updateAudioClip(id: string)
    {
        const clip = this.audioClips[id];
        this._durationLoads.get(clip)?.forEach((entry, language, entries) => {
            if (entry.uri !== clip.uris[language]) {
                entry.controller.abort(new DOMException("Audio file changed", "AbortError"));
                entries.delete(language);
            }
        });
        if (this.audioViews[id]) {
            if (this.audioViews[id].isConnected) {
                this.loadDuration(id);
            }
            this.audioViews[id].requestUpdate();
        }
        this.outs.updated.set();
    }

    protected onMetaComponent(event: IComponentEvent<CVMeta>)
    {
        const meta = event.object;

        if (meta.node.typeName === "NVScene" && event.add) {
            this.audioClips = meta.audio.dictionary;  // needed to support initially empty meta nodes
            meta.once("load", () => {
                this.audioClips = meta.audio.dictionary;
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

        if(this._narrationId && !this.audioClips[this._narrationId]) {
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

    play(id: string, useDefaultPlayer: boolean = false)
    {
        const { outs } = this;
        const uri = this.getAudioClipUri(id);

        if(!uri) {
            Notification.show("Failed to play audio clip - no uri", "warning");
            return;
        }

        const request = ++this._playRequest;
        const retry = !!this.durationLoad(id)?.error;
        this.audioView = this.getPlayerById(id);
        this.loadDuration(id, { retry: true });

        // handle currently playing track
        if(outs.isPlaying.value) {
            this.audioPlayer.pause();
        }

        this.initializeClip(id, retry);
        if(this.activeId !== id) {
            this.setTimeElapsed(0);
        }
        // Handle possible animation sync
        this.audioView.synched = false;
        const syncTime = this.actions?.getSyncTime(id);
        if(syncTime !== undefined) {
            this.setTimeElapsed(syncTime);
            this.audioView.synched = true;
        }

        this.audioPlayer.play()
        .then(() => {
            if (request !== this._playRequest) {
                return;
            }
            this.activeId = id;
            outs.isPlaying.setValue(true);
            this.isPlaying = true;
            outs.narrationPlaying.setValue(id == this.narrationId);
            this._useDefaultPlayer = useDefaultPlayer;
            this.updateGlobalPlayer();
            Object.keys(this.audioViews).forEach((key) => this.audioViews[key].requestUpdate());
            this.analytics.sendProperty("Audio_Play", uri);
        })
        .catch(error => {
            if (request === this._playRequest) {
                Notification.show(`Failed to play audio at '${uri}': ${error}`, "warning");
            }
        });
    }

    pause()
    {
        ++this._playRequest;
        if(!this.audioPlayer) {
            return;
        } 
        this.outs.isPlaying.setValue(false);
        this.audioPlayer.pause();
        this.audioView?.requestUpdate();
    }

    stop()
    {  
        if(!this.audioPlayer) {
            return;
        }    
        this.pause();
        this.setTimeElapsed(0);
        this.onEnd();
        this.outs.narrationPlaying.setValue(false);
    }

    protected onEnd = () => {
        const { outs } = this;
        
        this.isPlaying = false;
        this._useDefaultPlayer = false;
        outs.isPlaying.setValue(false);
        outs.narrationPlaying.setValue(false);
        outs.globalPlaying.setValue(false);
        this.audioView?.requestUpdate();
        this.ins.activeCaption.setValue("");
    }

    protected updateGlobalPlayer() {
        const duration = this.getDuration(this.activeId);
        // Unknown duration must not hide the controls of an otherwise playable clip.
        this.outs.globalPlaying.setValue(this.outs.narrationPlaying.value || (this._useDefaultPlayer
            && (isNaN(duration) || duration > 2)));
    }

    // Initialize player for a specific audio clip
    initializeClip(id: string, reload = false) {
        if(this.audioPlayer === null) {
            this.setupAudio();
        }

        const clip = this.audioClips[id];
        if(clip) {
            const uri = clip.uris[ELanguageType[this.language.outs.activeLanguage.getValidatedValue()] as TLanguageType];
            if (!uri) {
                return;
            }
            const assetUrl = this.assetManager.getAssetUrl(uri);
            if(this._playerUri !== assetUrl || reload) {
                this.clearPendingSeek();
                this.audioPlayer.setAttribute("src", assetUrl);
                this._playerUri = assetUrl;
                if (reload) {
                    this.audioPlayer.load();
                }
            }

            // Set caption track source
            const captionUri = clip.captionUris[ELanguageType[this.language.outs.activeLanguage.getValidatedValue()] as TLanguageType];
            if(captionUri && (this.audioPlayer.children.length == 0 || 
                (this.audioPlayer.children[0] as HTMLTrackElement).src != this.assetManager.getAssetUrl(captionUri))) {

                if(this.audioPlayer.children[0]) {
                    this.audioPlayer.children[0].remove();
                    this.ins.activeCaption.setValue("");
                }

                const textTrack = document.createElement('track');
                this.audioPlayer.append(textTrack);
                textTrack.setAttribute("src", this.assetManager.getAssetUrl(captionUri));
                textTrack.track.mode = "showing";
                textTrack.addEventListener("cuechange", this.onCueChange);
                textTrack.addEventListener("load", this.onLoadTrack);
            }
            else if(!captionUri && this.audioPlayer.children[0]) {
                this.audioPlayer.children[0].remove();
                this.ins.activeCaption.setValue("");
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
            audio.setAttribute("preload", "metadata");
            audio.addEventListener("timeupdate", this.onTimeChange);
            audio.addEventListener("loadedmetadata", this.onPlaybackDuration);
            audio.addEventListener("durationchange", this.onPlaybackDuration);
            audio.crossOrigin = "anonymous";

            audio.onerror = () => {
                const id = this.audioView?.audioId;
                const entry = this.durationLoad(id);
                const error = this.mediaError(this._playerUri, audio.error);
                if (entry?.element) {
                    this.finishDuration(id, entry, NaN, error);
                }
                ++this._playRequest;
                this.onEnd();
                Notification.show(error.message, "warning");
            };
        }
    }

    // Handle caption cue changes
    protected onCueChange = (event: Event) =>
    {
        const activeCues = (event.target as HTMLTrackElement).track.activeCues;
        const activeText = activeCues.length > 0 ? (activeCues[0] as VTTCue).text : "";
        this.ins.activeCaption.setValue(activeText);
    }

    // One-time setup after data is loaded
    protected onLoadTrack = (event: Event) =>
    {
        // Cues starting at zero cause issues, so add a small offset
        const cues = (this.audioPlayer.children[0] as HTMLTrackElement).track.cues;
        if(cues[0].startTime === 0) {
            cues[0].startTime = 0.01;
        }
    }

    // Handle audio time elapsed updates
    protected onTimeChange = (event: Event) =>
    {
        if (this.audioView) {
            this.audioView.elapsed = this.getTimeElapsed();
            this.audioView.requestUpdate();
        }
    }

    protected onLanguageChange() {
        this.stop();
        const language = ELanguageType[this.language.outs.activeLanguage.value];
        this._durationLoads.forEach(entries => entries.forEach((entry, key) => {
            if (key !== language && entry.element) {
                entry.controller.abort(new DOMException("Audio language changed", "AbortError"));
                entries.delete(key);
            }
        }));
        Object.keys(this.audioViews).forEach(id => {
            if (this.audioViews[id].isConnected) {
                this.loadDuration(id);
            }
            this.audioViews[id].requestUpdate();
        });
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

    @property({ attribute: false })
    synched: boolean = false;

    constructor()
    {
        super();

        this.onDrag = this.onDrag.bind(this);
        this.onKeyDown = this.onKeyDown.bind(this);

        this.addEventListener("keydown", this.onKeyDown);
    }

    protected firstConnected()
    {
        this.classList.add("sv-audio-view");
    }

    protected connected() {
        this.audio.loadDuration(this.audioId);
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
        const isPlaying = this.audio.outs.isPlaying.value && this.audioId == this.audio.activeId;
        const isGlobal = this.parentElement?.id === "global-audio";
        const duration = this.audio.getDuration(this.audioId);
        const canSeek = duration > 0;
        const elapsedStr = this.formatSeconds(this.elapsed);
        const durationStr = this.formatSeconds(duration);
        const exitBtn = isGlobal ? html`<ff-button title="exit audio" id="exit-btn" icon="close" @pointerdown=${this.stopAudio}></ff-button>` : null;
        return html`<ff-button title="play audio" id="play-btn" icon="${isPlaying ? "pause" : "triangle-right"}" @pointerdown=${(e) => this.playAudio(e, this.audioId, isGlobal)}></ff-button>
            <div aria-hidden="true" class="sv-timer">${elapsedStr}/${durationStr}</div>
            <input title="audio slider" ?disabled=${this.synched || !canSeek} id="time-slider" @pointerdown=${this.onDrag} @change=${this.onTimeChange} type="range" min="0" step="0.1" max="${canSeek ? duration : 0}" value="${this.elapsed}" class="slider">
            ${exitBtn}`;
    }

    protected playAudio(event: MouseEvent, id: string, isGlobal: boolean) {
        const audio = this.audio;
        const isPlaying = this.audio.outs.isPlaying.value && this.audioId == this.audio.activeId;

        if(!isPlaying) {
            audio.play(id, isGlobal);
        }
        else {
            audio.pause();
        }
    }

    protected stopAudio() {
        const audio = this.audio;
        audio.stop();
    }

    protected onDrag(event: MouseEvent) {
        event.stopPropagation();
    }

    protected onKeyDown(e: KeyboardEvent)
    {
        if (e.code === "Space" || e.code === "Enter") {
            if((e.target as HTMLElement).id == "play-btn") {
                this.playAudio(null, this.audioId, this.parentElement?.id === "global-audio");
            }
            else if((e.target as HTMLElement).id == "exit-btn") {
                this.stopAudio();
            }
        }
        else if(e.code === "ArrowUp" || e.code === "ArrowDown" || e.code === "ArrowLeft" || e.code === "ArrowRight") {
            if((e.target as HTMLElement).id == "time-slider") {
                e.stopPropagation();
            }
        }
    }

    protected onTimeChange() {
        const isActive = this.audioId == this.audio.activeId;
        const duration = this.audio.getDuration(this.audioId);

        if(isActive && !this.synched && duration > 0) {
            const time = parseFloat((this.querySelector("#time-slider") as HTMLInputElement).value);
            this.audio.initializeClip(this.audioId);
            this.audio.setTimeElapsed(Math.max(0, Math.min(duration, time)));
        }
    }

    // Format seconds in friendlier datetime-like string
    protected formatSeconds(seconds: number) {
        if (!Number.isFinite(seconds) || seconds < 0) {
            return "--:--";
        }
        return Math.floor(seconds / 60).toString().padStart(2, "0") + ":"
            + Math.floor(seconds % 60).toString().padStart(2, "0");
    }
}
