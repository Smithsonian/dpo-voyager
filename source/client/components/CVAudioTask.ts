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

import Document from "@ff/core/Document";

import CVTask, { types } from "./CVTask";
import AudioTaskView from "../ui/story/AudioTaskView";

import { Node } from "@ff/graph/Component";
import CVDocument from "./CVDocument";
import CVAudioManager from "./CVAudioManager";
import { ELanguageStringType, ELanguageType } from "client/schema/common";

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
        isNarration: types.Boolean("Audio.IsNarration", false),
        language: types.Option("Task.Language", Object.keys(ELanguageStringType).map(key => ELanguageStringType[key]), ELanguageStringType[ELanguageType.EN]),
    };

    protected static readonly outs = {
        //ready: types.Boolean("Picture.Ready"),
    };

    ins = this.addInputs<CVTask, typeof CVAudioTask.ins>(CVAudioTask.ins);
    outs = this.addOutputs<CVTask, typeof CVAudioTask.outs>(CVAudioTask.outs);

    audioManager: CVAudioManager = null;

    constructor(node: Node, id: string)
    {
        super(node, id);
    }

    createView()
    {
        return new AudioTaskView(this);
    }

    activateTask()
    {
        // automatically select scene node
        //this.nodeProvider.activeNode = this.nodeProvider.scopedNodes[0];
        
        this.startObserving();
        super.activateTask();

        this.synchLanguage();
    }

    deactivateTask()
    {
        this.stopObserving();
        super.deactivateTask();
    }

    update()
    {
        const ins = this.ins;
        const audioManager = this.audioManager;

        if(!audioManager) {
            return false;
        }

        const clip = audioManager.getAudioClip(ins.activeId.value);
        const languageManager = this.activeDocument.setup.language;

        if(ins.language.changed) {   
            const newLanguage = ELanguageType[ELanguageType[ins.language.value]];

            languageManager.addLanguage(newLanguage);  // add in case this is a currently inactive language
            languageManager.ins.language.setValue(newLanguage);
        }

        if (ins.create.changed) {
            audioManager.addAudioClip({
                id: Document.generateId(),
                name: "New Audio Element",
                uris: {}
            });
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

        if (ins.title.changed || ins.filepath.changed) {
            clip.name = ins.title.value;
            clip.uris[ELanguageType[ins.language.value]] = ins.filepath.value;
        }
        if (ins.isNarration.changed) {
            audioManager.narrationId = ins.isNarration.value ? clip.id : "";
        }

        return true;
    }

    protected onActiveDocument(previous: CVDocument, next: CVDocument)
    {
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

        ins.title.setValue(clip ? clip.name : "", true);
        ins.filepath.setValue(clip ? clip.uris[ELanguageType[ins.language.value]] : "", true);
        ins.isNarration.setValue(clip ? this.audioManager.narrationId === clip.id : false, true);
    }

    protected onDocumentLanguageChange()
    {
        this.onAudioChange();
        this.synchLanguage();
    }

    // Make sure this task language matches document
    protected synchLanguage() {
        const {ins} = this;
        const languageManager = this.activeDocument.setup.language;

        if(ins.language.value !== languageManager.outs.language.value)
        {
            ins.language.setValue(languageManager.outs.language.value, true);
        }
    }
}