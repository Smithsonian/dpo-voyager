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

import Document from "@ff/core/Document";

import CVTask, { types } from "./CVTask";
import MultimediaTaskView from "../ui/story/MultimediaTaskView";

import { Node } from "@ff/graph/Component";
import CVDocument from "./CVDocument";
import CVAudioManager from "./CVAudioManager";
import CVVideoManager from "./CVVideoManager";

////////////////////////////////////////////////////////////////////////////////

export default class CVMultimediaTask extends CVTask
{
    static readonly typeName: string = "CVMultimediaTask";

    static readonly text: string = "Multimedia";
    static readonly icon: string = "audio";

    protected static readonly ins = {
        createAudio: types.Event("Audio.Create"),
        createVideo: types.Event("Video.Create"),
        delete: types.Event("Audio.Delete"),
        play: types.Event("Audio.Play"),
        stop: types.Event("Audio.Stop"),
        activeId: types.String("Audio.ActiveId", ""),
        title: types.String("Audio.Title", ""),
        filepath: types.String("Audio.Filepath", null),
        captionPath: types.String("Audio.CaptionPath", null),
        isNarration: types.Boolean("Audio.IsNarration", false),
    };

    protected static readonly outs = {
    };

    ins = this.addInputs<CVTask, typeof CVMultimediaTask.ins>(CVMultimediaTask.ins);
    outs = this.addOutputs<CVTask, typeof CVMultimediaTask.outs>(CVMultimediaTask.outs);

    audioManager: CVAudioManager = null;
    videoManager: CVVideoManager = null;
    protected _videoMode = false;

    constructor(node: Node, id: string)
    {
        super(node, id);
    }

    create()
    {
        super.create();
        this.startObserving();
    }

    dispose()
    {
        this.stopObserving();
        super.dispose();
    }

    createView()
    {
        return new MultimediaTaskView(this);
    }

    protected getActiveClip(id: string = this.ins.activeId.value)
    {
        const videoClip = this.videoManager?.getVideoClip(id);
        if (videoClip) {
            return { clip: videoClip, isVideo: true };
        }

        const audioClip = this.audioManager?.getAudioClip(id);
        if (audioClip) {
            return { clip: audioClip, isVideo: false };
        }

        return { clip: null, isVideo: this._videoMode };
    }

    update()
    {
        const { ins } = this;
        const { clip, isVideo } = this.getActiveClip();
        const mediaManager = isVideo ? this.videoManager : this.audioManager;

        if(!mediaManager) {
            return false;
        }

        const languageManager = this.activeDocument.setup.language;
        const activeLanguage = languageManager.codeString();

        if (ins.createAudio.changed || ins.createVideo.changed) {
            const createVideo = ins.createVideo.changed;
            const targetManager = createVideo ? this.videoManager : this.audioManager;
            const newId = Document.generateId();
            targetManager[createVideo ? "addVideoClip" : "addAudioClip"]({
                id: newId,
                name: `New ${createVideo ? "Video" : "Audio"} Element`,
                uris: {},
                captionUris: {},
                durations: {}
            });
            this._videoMode = createVideo;
            ins.activeId.setValue(newId);
            return true;
        }

        if (ins.delete.changed) {
            mediaManager[isVideo ? "removeVideoClip" : "removeAudioClip"](ins.activeId.value);
            return true;
        }
        if (ins.play.changed) {
            mediaManager.play(ins.activeId.value);
            return true;
        }
        if (ins.stop.changed) {
            mediaManager.stop();
            return true;
        }

        if (clip && (ins.title.changed || ins.filepath.changed || ins.captionPath.changed)) {
            clip.name = ins.title.value;
            clip.uris[activeLanguage] = ins.filepath.value;
            clip.captionUris[activeLanguage] = ins.captionPath.value;
            mediaManager[isVideo ? "updateVideoClip" : "updateAudioClip"](clip.id);
        }
        if (!isVideo && ins.isNarration.changed) {
            this.audioManager.narrationId = ins.isNarration.value ? clip.id : "";
        }

        return true;
    }

    protected onActiveDocument(previous: CVDocument, next: CVDocument)
    {
        super.onActiveDocument(previous, next);

        if (previous) {
            this.ins.activeId.off("value", this.onMediaChange, this);
            previous.setup.language.outs.activeLanguage.off("value", this.onDocumentLanguageChange, this);

            this.audioManager = null;
            this.videoManager = null;
        }
        if (next) {
            this.audioManager = next.setup.audio;
            this.videoManager = next.setup.video;

            this.ins.activeId.on("value", this.onMediaChange, this);
            next.setup.language.outs.activeLanguage.on("value", this.onDocumentLanguageChange, this);
        }
    }

    protected onMediaChange()
    {
        const ins = this.ins;
        const { clip, isVideo } = this.getActiveClip(ins.activeId.value);
        this._videoMode = isVideo;
        const languageManager = this.activeDocument.setup.language;
        const activeLanguage = languageManager.codeString();

        ins.title.setValue(clip ? clip.name : "", true);
        ins.filepath.setValue(clip ? clip.uris[activeLanguage] : "", true);
        ins.captionPath.setValue(clip ? clip.captionUris[activeLanguage] : "", true);
        if (!isVideo) {
            ins.isNarration.setValue(clip ? this.audioManager.narrationId === clip.id : false, true);
        }
        else {
            ins.isNarration.setValue(false, true);
        }
    }

    protected onDocumentLanguageChange()
    {
        this.onMediaChange();
    }
}