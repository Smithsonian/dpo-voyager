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

import { types } from "@ff/graph/Component";
import { IAudio } from "client/schema/setup";
import CVMeta from "./CVMeta";
import { Dictionary } from "client/../../libs/ff-core/source/types";
import { IMediaClip } from "client/schema/meta";
import { TLanguageType, ELanguageType } from "client/schema/common";
import Notification from "@ff/ui/Notification";
import CustomElement, { customElement, html, property, PropertyValues } from "@ff/ui/CustomElement";
import CVMultiMediaManager from "./CVMultiMediaManager";

////////////////////////////////////////////////////////////////////////////////

export default class CVVideoManager extends CVMultiMediaManager<VideoView>
{
    static readonly typeName: string = "CVVideoManager";

    static readonly text: string = "Video";
    static readonly icon: string = "";

    static readonly isSystemSingleton = true;

    private _videoMap: Dictionary<string> = {};

    protected static readonly ins = {
        ...CVVideoManager.createCommonIns("Video"),
    };

    protected static readonly outs = {
        narrationPlaying: types.Boolean("Video.Playing", false),
        globalPlaying: types.Boolean("Video.GlobalPlaying", false),
        isPlaying: types.Boolean("Video.IsPlaying", false),
        updated: types.Event("Video.Updated")
    };

    ins = this.addInputs(CVVideoManager.ins);
    outs = this.addOutputs(CVVideoManager.outs);

    protected get mediaViewCtor() {
        return VideoView;
    }

    protected get mediaViewManagerKey() {
        return "video";
    }

    protected get mediaViewIdKey() {
        return "videoId";
    }

    protected getMetaClips(meta: CVMeta)
    {
        return meta.video.dictionary;
    }

    protected updateClip(id: string)
    {
        this.updateVideoClip(id);
    }

    protected onBeforeAddClip(clip: IMediaClip): void
    {
		this.getGraphComponent(CVMeta)?.video.insert(clip);
    }

    protected onBeforeRemoveClip(id: string): void
    {
		this.getGraphComponent(CVMeta)?.video.remove(id);
    }

    create()
    {
        super.create();
    }

    dispose()
    {
        Object.keys(this._videoMap).forEach((key) => URL.revokeObjectURL(this._videoMap[key]));
        super.dispose();
    }

    update()
    {
        return super.update();
    }

    getPlayerById(id: string) {
        return super.getPlayerById(id);
    }

    getVideoList()
    {
        return this.getMediaList();
    }

    getVideoClip(id: string) {
        return this.getMediaClip(id);
    }

    getVideoClipUri(id: string) {
        return this.getMediaClipUri(id);
    }

    getDuration(id: string) {
        const clip = this.clips[id];
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

    updateVideoClip(id: string)
    {
        this.clips[id].durations = {};
        this.getDuration(id);
        this.outs.updated.set();
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
        this.view = this.getPlayerById(id);

        if (!uri) {
            Notification.show("Failed to play video clip - no uri", "warning");
            return;
        }

        if (this.outs.isPlaying.value) {
            this.player.pause();
        }

        if (this.activeId !== id) {
            this.setTimeElapsed(0);
        }

        this.initializeClip(id);

        this.player.play()
        .then(() => {
            this.activeId = id;
            this.isPlaying = true;
            this.outs.isPlaying.setValue(true);
            this.outs.globalPlaying.setValue(useDefaultPlayer || this.outs.isPlaying.value);
            Object.keys(this.views).forEach((key) => this.views[key].requestUpdate());
            this.analytics.sendProperty("Video_Play", uri);
        })
        .catch(error => Notification.show(`Failed to play video at '${this.player.getAttribute("src")}':${error}`, "warning"));
    }

    protected onEnd = () => {
        this.isPlaying = false;
        this.outs.isPlaying.setValue(false);
        this.outs.globalPlaying.setValue(false);
        this.view?.requestUpdate();
        this.ins.activeCaption.setValue("");
    }

    initializeClip(id: string) {
        if (this.player === null) {
            this.setupVideo();
        }

        const clip = this.clips[id];
        if (clip) {
            const uri = clip.uris[ELanguageType[this.language.outs.activeLanguage.getValidatedValue()] as TLanguageType];
            if (uri && this.player.src != this.assetManager.getAssetUrl(uri)) {
                this.player.setAttribute("src", this.assetManager.getAssetUrl(uri));
            }
        }
    }

    setupVideo()
    {
        if (this.player === null) {
            const video = this.player = document.createElement("video");
            video.onended = this.onEnd;
            video.setAttribute("controls", "");
            video.setAttribute("preload", "auto");
            video.addEventListener("timeupdate", this.onTimeChange);
            video.crossOrigin = "anonymous";
        }
    }

    protected onTimeChange = () =>
    {
        if (!this.view) {
            return;
        }

        this.view.elapsed = this.getTimeElapsed();
        this.view.requestUpdate();
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
