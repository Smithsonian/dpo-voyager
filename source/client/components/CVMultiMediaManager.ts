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

import Component, { IComponentEvent, types } from "@ff/graph/Component";
import { Dictionary } from "client/../../libs/ff-core/source/types";
import { IMediaClip } from "client/schema/meta";
import CVAssetManager from "./CVAssetManager";
import CVLanguageManager from "./CVLanguageManager";
import { ELanguageType } from "client/schema/common";
import CVAnalytics from "./CVAnalytics";
import CVAssetReader from "./CVAssetReader";
import CVActionManager from "./CVActionManager";
import CVMeta from "./CVMeta";

////////////////////////////////////////////////////////////////////////////////

interface IMediaView
{
	elapsed: number;
	requestUpdate(): void;
}

interface IBooleanProperty
{
	value: boolean;
	setValue(value: boolean): void;
}

interface IEventProperty
{
	changed: boolean;
}

interface ISetEventProperty
{
	set(): void;
}

export default abstract class CVMultiMediaManager<TView extends IMediaView = IMediaView> extends Component
{
	protected static createCommonIns(prefix: string)
	{
		return {
			reset: types.Event(`${prefix}.Reset`),
			activeCaption: types.String(`${prefix}.ActiveCaption`),
			captionsEnabled: types.Boolean(`${prefix}.CaptionsEnabled`, true)
		};
	}

	protected _activeId: string = null;
	protected clips: Dictionary<IMediaClip> = {};
	protected player: HTMLMediaElement = null;
	protected view: TView = null;
	protected views: Dictionary<TView> = {};
	protected isPlaying = false;

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

	protected abstract get mediaViewCtor(): new () => TView;
	protected abstract get mediaViewManagerKey(): string;
	protected abstract get mediaViewIdKey(): string;
	protected abstract getMetaClips(meta: CVMeta): Dictionary<IMediaClip>;
	protected abstract updateClip(id: string): void;
	abstract getDuration(id: string): string;

	protected get resetProperty()
	{
		return (this.ins as any).reset as IEventProperty;
	}

	protected get globalPlayingProperty()
	{
		return (this.outs as any).globalPlaying as IBooleanProperty;
	}

	protected get isPlayingProperty()
	{
		return (this.outs as any).isPlaying as IBooleanProperty;
	}

	protected get updatedProperty()
	{
		return (this.outs as any).updated as ISetEventProperty;
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
		this.language.outs.activeLanguage.off("value", this.onLanguageChange, this);
		this.graph.components.off(CVMeta, this.onMetaComponent, this);
		this.stop();
		super.dispose();
	}

	update()
	{
		if (this.resetProperty.changed) {
			this.stop();
			this.globalPlayingProperty.setValue(false);
		}

		return true;
	}

	protected getMediaList()
	{
		return Object.keys(this.clips).map(key => this.clips[key]);
	}

	protected getMediaClip(id: string)
	{
		return this.clips[id];
	}

	protected getMediaClipUri(id: string)
	{
		const clip = this.clips[id];
		return clip ? clip.uris[ELanguageType[this.language.outs.activeLanguage.value]] : null;
	}

	addClip(clip: IMediaClip)
	{
		this.onBeforeAddClip(clip);
		this.clips[clip.id] = clip;
		this.updatedProperty.set();
	}

	removeClip(id: string)
	{
		if (this.isPlayingProperty.value && id == this.activeId) {
			this.stop();
		}

		this.onBeforeRemoveClip(id);
		delete this.clips[id];
		this.updatedProperty.set();
	}

	protected getPlayerById(id: string)
	{
		if (!this.views.hasOwnProperty(id)) {
			this.views[id] = this.createMediaView(id);
		}

		return this.views[id];
	}

	protected createMediaView(id: string)
	{
		const view = new this.mediaViewCtor() as TView;
		const mutableView = view as any;
		mutableView[this.mediaViewManagerKey] = this;
		mutableView[this.mediaViewIdKey] = id;
		view.requestUpdate();
		return view;
	}

	getTimeElapsed()
	{
		if (this.player) {
			return Math.round(this.player.currentTime * Math.pow(10, 3)) / Math.pow(10, 3);
		}

		return 0;
	}

	setTimeElapsed(time: number)
	{
		if (this.player && this.view) {
			if (this.player.seekable.length === 0) {
				this.player.addEventListener("canplay", () => this.setTimeElapsed(time), { once: true });
			}
			else {
				this.player.currentTime = time;
				this.view.elapsed = time;
				this.view.requestUpdate();
			}
		}
	}

	pause()
	{
		if (!this.player) {
			return;
		}

		this.isPlayingProperty.setValue(false);
		this.player.pause();
		this.view?.requestUpdate();
	}

	stop()
	{
		if (!this.player) {
			return;
		}

		this.pause();
		this.setTimeElapsed(0);
		this.onEnd();
	}

	protected onMetaComponent(event: IComponentEvent<CVMeta>)
	{
		const meta = event.object;

		if (meta.node.typeName === "NVScene" && event.add) {
			this.clips = this.getMetaClips(meta);
			meta.once("load", () => {
				this.clips = this.getMetaClips(meta);
				Object.keys(this.clips).forEach(key => {
					this.updateClip(this.clips[key].id);
				});
			});
		}
	}

	protected onLanguageChange()
	{
		this.stop();
	}

	protected onBeforeAddClip(clip: IMediaClip): void {}
	protected onBeforeRemoveClip(id: string): void {}

	protected abstract onEnd(): void;
}
