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

import Document from "@ff/core/Document";

import CVTask, { types } from "./CVTask";
import AudioTaskView from "../ui/story/AudioTaskView";

import { Node } from "@ff/graph/Component";
import CVDocument from "./CVDocument";
import CVAudioManager from "./CVAudioManager";
import { DEFAULT_LANGUAGE, ELanguageStringType, ELanguageType } from "client/schema/common";

////////////////////////////////////////////////////////////////////////////////

export default class CVAudioTask extends CVTask
{
    static readonly typeName: string = "CVAudioTask";

    static readonly text: string = "Audio";
    static readonly icon: string = "audio";

    protected static readonly ins = {
        create: types.Event("Audio.Create"),
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

    ins = this.addInputs<CVTask, typeof CVAudioTask.ins>(CVAudioTask.ins);
    outs = this.addOutputs<CVTask, typeof CVAudioTask.outs>(CVAudioTask.outs);

    audioManager: CVAudioManager = null;

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
        return new AudioTaskView(this);
    }

    activateTask()
    {
        // automatically select scene node
        //this.nodeProvider.activeNode = this.nodeProvider.scopedNodes[0];
        
        super.activateTask();
    }

    deactivateTask()
    {
        super.deactivateTask();
    }

    update()
    {
        const { ins } = this;
        const audioManager = this.audioManager;

        if(!audioManager) {
            return false;
        }

        const clip = audioManager.getAudioClip(ins.activeId.value);
        const languageManager = this.activeDocument.setup.language;
        const activeLanguage = languageManager.codeString();

        if (ins.create.changed) {
            const newId = Document.generateId();
            audioManager.addAudioClip({
                id: newId,
                name: "New Audio Element",
                uris: {},
                captionUris: {},
                durations: {}
            });
            ins.activeId.setValue(newId);
            return true;
        }
        if (ins.delete.changed) {
            audioManager.removeAudioClip(ins.activeId.value);
            return true;
        }
        if (ins.play.changed) {
            audioManager.play(ins.activeId.value);
            return true;
        }
        if (ins.stop.changed) {
            audioManager.stop();
            return true;
        }

        if (clip && (ins.title.changed || ins.filepath.changed || ins.captionPath.changed)) {
            clip.name = ins.title.value;
            clip.uris[activeLanguage] = ins.filepath.value;
            clip.captionUris[activeLanguage] = ins.captionPath.value;
            audioManager.updateAudioClip(clip.id);
        }
        if (ins.isNarration.changed) {
            audioManager.narrationId = ins.isNarration.value ? clip.id : "";
        }

        return true;
    }

    protected onActiveDocument(previous: CVDocument, next: CVDocument)
    {
        super.onActiveDocument(previous, next);

        if (previous) {
            this.ins.activeId.off("value", this.onAudioChange, this);
            previous.setup.language.outs.language.off("value", this.onDocumentLanguageChange, this);

            this.audioManager = null;
        }
        if (next) {
            this.audioManager = next.setup.audio;

            this.ins.activeId.on("value", this.onAudioChange, this);
            next.setup.language.outs.language.on("value", this.onDocumentLanguageChange, this);
        }
    }

    protected onAudioChange()
    {
        const ins = this.ins;
        const audioManager = this.audioManager;
        const clip = audioManager.getAudioClip(ins.activeId.value);
        const languageManager = this.activeDocument.setup.language;
        const activeLanguage = languageManager.codeString();

        ins.title.setValue(clip ? clip.name : "", true);
        ins.filepath.setValue(clip ? clip.uris[activeLanguage] : "", true);
        ins.captionPath.setValue(clip ? clip.captionUris[activeLanguage] : "", true);
        ins.isNarration.setValue(clip ? this.audioManager.narrationId === clip.id : false, true);
    }

    protected onDocumentLanguageChange()
    {
        this.onAudioChange();
    }
}