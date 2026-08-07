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
import { IMediaClip } from "client/schema/meta";
import CVAssetManager from "./CVAssetManager";
import CVLanguageManager from "./CVLanguageManager";
import { TLanguageType, ELanguageType } from "client/schema/common";
import Notification from "@ff/ui/Notification";
import CustomElement, { customElement, html, property, PropertyValues } from "@ff/ui/CustomElement";
import CVAnalytics from "./CVAnalytics";
import CVAssetReader from "./CVAssetReader";
import CVAnnotationView from "./CVAnnotationView";
import CVActionManager from "./CVActionManager";

////////////////////////////////////////////////////////////////////////////////

export default class CVVideoManager extends Component
{
    static readonly typeName: string = "CVVideoManager";

    static readonly text: string = "Video";
    static readonly icon: string = "";

    static readonly isSystemSingleton = true;

    private _activeId: string = null;
    private _videoMap: Dictionary<string> = {};

    protected videoClips: Dictionary<IMediaClip> = {};
    protected videoPlayer: HTMLVideoElement = null;
    protected videoView: VideoView = null;
    protected videoViews: Dictionary<VideoView> = {};
    protected isPlaying: boolean = false;

    protected static readonly ins = {
        reset: types.Event("Video.Reset"),
        activeCaption: types.String("Video.ActiveCaption"),
        captionsEnabled: types.Boolean("Video.CaptionsEnabled", true),
    };

    protected static readonly outs = {
        narrationPlaying: types.Boolean("Video.Playing", false),
        globalPlaying: types.Boolean("Video.GlobalPlaying", false),
        isPlaying: types.Boolean("Video.IsPlaying", false),
        updated: types.Event("Video.Updated")
    };

    ins = this.addInputs(CVVideoManager.ins);
    outs = this.addOutputs(CVVideoManager.outs);

    protected get assetManager() {
        return this.getMainComponent(CVAssetManager);
    }
    protected get assetReader() {
        return this.getMainComponent(CVAssetReader);
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

    protected get metaVideo()
    {
        const meta = this.getGraphComponent(CVMeta);
        return meta ? meta.video : null;
    }

    get activeId() {
        return this._activeId || "";
    }
    set activeId(id: string) {
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
        Object.keys(this._videoMap).forEach((key) => URL.revokeObjectURL(this._videoMap[key]));

        this.language.outs.activeLanguage.off("value", this.onLanguageChange, this);
        this.graph.components.off(CVMeta, this.onMetaComponent, this);

        this.stop();
        super.dispose();
    }

    update()
    {
        const { ins, outs } = this;

        if (ins.reset.changed) {
            this.stop();
            outs.globalPlaying.setValue(false);
        }

        return true;
    }

    getPlayerById(id: string) {
        if (!this.videoViews.hasOwnProperty(id)) {
            const view = this.videoViews[id] = new VideoView;
            view.video = this;
            view.videoId = id;
            view.requestUpdate();
        }

        return this.videoViews[id];
    }

    getVideoList()
    {
        return Object.keys(this.videoClips).map(key => this.videoClips[key]);
    }

    getVideoClip(id: string) {
        return this.videoClips[id];
    }

    getVideoClipUri(id: string) {
        const clip = this.videoClips[id];
        return clip ? clip.uris[ELanguageType[this.language.outs.activeLanguage.value]] : null;
    }

    getDuration(id: string) {
        const clip = this.videoClips[id];
        const activeLanguage = ELanguageType[this.language.outs.activeLanguage.getValidatedValue()] as TLanguageType;
        const cachedDuration = clip?.durations[activeLanguage];
        if (cachedDuration) {
            return cachedDuration;
        }

        const uri = clip?.uris[activeLanguage] || Object.values(clip?.uris || {})[0];
        if (!uri) {
            return "pending";
        }

        clip.durations[activeLanguage] = "pending";
        const video = document.createElement("video");
        video.preload = "metadata";
        video.crossOrigin = "anonymous";
        video.onloadedmetadata = () => {
            clip.durations[activeLanguage] = video.duration.toString();
            if (id === this.activeId) {
                this.getPlayerById(id).requestUpdate();
            }
            video.src = "";
        };
        video.src = this.assetManager.getAssetUrl(uri);
        video.load();
        return "pending";
    }

    getTimeElapsed() {
        if (this.videoPlayer) {
            return Math.round(this.videoPlayer.currentTime * Math.pow(10, 3)) / Math.pow(10, 3);
        }
        return 0;
    }

    setTimeElapsed(time: number) {
        if (this.videoPlayer && this.videoView) {
            if (this.videoPlayer.seekable.length === 0) {
                this.videoPlayer.addEventListener("canplay", () => this.setTimeElapsed(time), {once: true});
            }
            else {
                this.videoPlayer.currentTime = time;
                this.videoView.elapsed = time;
                this.videoView.requestUpdate();
            }
        }
    }

    addVideoClip(clip: IMediaClip)
    {
        this.metaVideo?.insert(clip);
        this.videoClips[clip.id] = clip;
        this.outs.updated.set();
    }

    removeVideoClip(id: string)
    {
        if (this.isPlaying && id == this.activeId) {
            this.stop();
        }
        this.metaVideo?.remove(id);
        delete this.videoClips[id];
    }

    updateVideoClip(id: string)
    {
        this.videoClips[id].durations = {};
        this.getDuration(id);
        this.outs.updated.set();
    }

    protected onMetaComponent(event: IComponentEvent<CVMeta>)
    {
        const meta = event.object;

        if (meta.node.typeName === "NVScene" && event.add) {
            this.videoClips = meta.video.dictionary;
            meta.once("load", () => {
                this.videoClips = meta.video.dictionary;
                Object.keys(this.videoClips).forEach(key => {
                    this.updateVideoClip(this.videoClips[key].id);
                });
            });
        }
    }

    fromData(data: IAudio)
    {
        data = data || {} as IAudio;
        if (data.narrationId) {
            this._activeId = data.narrationId;
        }
    }

    toData(): IAudio
    {
        return this._activeId ? { narrationId: this._activeId } : null;
    }

    play(id: string, useDefaultPlayer: boolean = false)
    {
        const uri = this.getVideoClipUri(id);
        this.videoView = this.getPlayerById(id);

        if (!uri) {
            Notification.show("Failed to play video clip - no uri", "warning");
            return;
        }

        if (this.outs.isPlaying.value) {
            this.videoPlayer.pause();
        }

        if (this.activeId !== id) {
            this.setTimeElapsed(0);
        }

        this.initializeClip(id);

        this.videoPlayer.play()
        .then(() => {
            this.activeId = id;
            this.isPlaying = true;
            this.outs.isPlaying.setValue(true);
            this.outs.globalPlaying.setValue(useDefaultPlayer || this.outs.isPlaying.value);
            Object.keys(this.videoViews).forEach((key) => this.videoViews[key].requestUpdate());
            this.analytics.sendProperty("Video_Play", uri);
        })
        .catch(error => Notification.show(`Failed to play video at '${this.videoPlayer.getAttribute("src")}':${error}`, "warning"));
    }

    pause()
    {
        if (!this.videoPlayer) {
            return;
        }
        this.outs.isPlaying.setValue(false);
        this.videoPlayer.pause();
        this.videoView?.requestUpdate();
    }

    stop()
    {
        if (!this.videoPlayer) {
            return;
        }
        this.pause();
        this.setTimeElapsed(0);
        this.onEnd();
    }

    protected onEnd = () => {
        this.isPlaying = false;
        this.outs.isPlaying.setValue(false);
        this.outs.globalPlaying.setValue(false);
        this.videoView?.requestUpdate();
        this.ins.activeCaption.setValue("");
    }

    initializeClip(id: string) {
        if (this.videoPlayer === null) {
            this.setupVideo();
        }

        const clip = this.videoClips[id];
        if (clip) {
            const uri = clip.uris[ELanguageType[this.language.outs.activeLanguage.getValidatedValue()] as TLanguageType];
            if (uri && this.videoPlayer.src != this.assetManager.getAssetUrl(uri)) {
                this.videoPlayer.setAttribute("src", this.assetManager.getAssetUrl(uri));
            }
        }
    }

    setupVideo()
    {
        if (this.videoPlayer === null) {
            const video = this.videoPlayer = document.createElement("video");
            video.onended = this.onEnd;
            video.setAttribute("controls", "");
            video.setAttribute("preload", "auto");
            video.addEventListener("timeupdate", this.onTimeChange);
            video.crossOrigin = "anonymous";
        }
    }

    protected onTimeChange = () =>
    {
        if (!this.videoView) {
            return;
        }

        this.videoView.elapsed = this.getTimeElapsed();
        this.videoView.requestUpdate();
    }

    protected onLanguageChange() {
        this.stop();
    }
}

@customElement("sv-video-view")
export class VideoView extends CustomElement
{
    @property({ attribute: false })
    video: CVVideoManager = null;

    @property({ attribute: false })
    videoId: string = "";

    @property({ attribute: false })
    elapsed: number = 0;

    constructor()
    {
        super();
        this.onDrag = this.onDrag.bind(this);
        this.onKeyDown = this.onKeyDown.bind(this);
        this.addEventListener("keydown", this.onKeyDown);
    }

    protected firstConnected()
    {
        this.classList.add("sv-video-view");
    }

    protected update(changedProperties: PropertyValues): void
    {
        if (changedProperties.has("elapsed")) {
            const slider = this.querySelector("#time-slider") as HTMLInputElement;
            if (slider) {
                slider.value = this.elapsed.toString();
            }
        }
        super.update(changedProperties);
    }

    protected render()
    {
        const isPlaying = this.video.outs.isPlaying.value && this.videoId == this.video.activeId;
        const isGlobal = this.parentElement.id === "global-video";
        const duration = this.video.getDuration(this.videoId);
        const elapsedStr = this.formatSeconds(this.elapsed);
        const durationStr = duration == "pending" ? duration : this.formatSeconds(parseInt(duration));
        const exitBtn = isGlobal ? html`<ff-button title="exit video" id="exit-btn" icon="close" @pointerdown=${this.stopVideo}></ff-button>` : null;
        return html`<ff-button title="play video" id="play-btn" icon="${isPlaying ? "pause" : "triangle-right"}" @pointerdown=${(e) => this.playVideo(e, this.videoId, isGlobal)}></ff-button>
            <div aria-hidden="true" class="sv-timer">${elapsedStr}/${durationStr}</div>
            <input title="video slider" id="time-slider" @pointerdown=${this.onDrag} @change=${this.onTimeChange} type="range" min="0" step="0.1" max="${duration}" value="${this.elapsed}" class="slider">
            ${exitBtn}`;
    }

    protected playVideo(event: MouseEvent, id: string, isGlobal: boolean) {
        const video = this.video;
        const isPlaying = this.video.outs.isPlaying.value && this.videoId == this.video.activeId;

        if (!isPlaying) {
            video.play(id, isGlobal);
        }
        else {
            video.pause();
        }
    }

    protected stopVideo() {
        this.video.stop();
    }

    protected onDrag(event: MouseEvent) {
        event.stopPropagation();
    }

    protected onKeyDown(e: KeyboardEvent)
    {
        if (e.code === "Space" || e.code === "Enter") {
            if ((e.target as HTMLElement).id == "play-btn") {
                this.playVideo(null, this.videoId, this.parentElement.id === "global-video");
            }
            else if ((e.target as HTMLElement).id == "exit-btn") {
                this.stopVideo();
            }
        }
        else if (e.code === "ArrowUp" || e.code === "ArrowDown" || e.code === "ArrowLeft" || e.code === "ArrowRight") {
            if ((e.target as HTMLElement).id == "time-slider") {
                e.stopPropagation();
            }
        }
    }

    protected onTimeChange() {
        const isActive = this.videoId == this.video.activeId;

        if (isActive) {
            this.video.initializeClip(this.videoId);
            this.video.setTimeElapsed(parseFloat((this.querySelector("#time-slider") as HTMLInputElement).value) | 0);
        }
    }

    protected formatSeconds(seconds: number) {
        const date = new Date(0);
        date.setSeconds(seconds);
        return date.toISOString().substring(14, 19);
    }
}
