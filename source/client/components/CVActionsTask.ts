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
import ActionsTaskView from "../ui/story/ActionsTaskView";

import { Node } from "@ff/graph/Component";
import CVDocument from "./CVDocument";
import { ELanguageStringType, ELanguageType } from "client/schema/common";
import CVActionManager from "./CVActionManager";

////////////////////////////////////////////////////////////////////////////////

export default class CVActionsTask extends CVTask
{
    static readonly typeName: string = "CVActionsTask";

    static readonly text: string = "Audio";
    static readonly icon: string = "audio";

    protected static readonly ins = {
        /*create: types.Event("Audio.Create"),
        delete: types.Event("Audio.Delete"),
        play: types.Event("Audio.Play"),
        stop: types.Event("Audio.Stop"),
        activeId: types.String("Audio.ActiveId", ""),
        title: types.String("Audio.Title", ""),
        filepath: types.String("Audio.Filepath", null),
        captionPath: types.String("Audio.CaptionPath", null),
        isNarration: types.Boolean("Audio.IsNarration", false),*/
    };

    protected static readonly outs = {
    };

    ins = this.addInputs<CVTask, typeof CVActionsTask.ins>(CVActionsTask.ins);
    outs = this.addOutputs<CVTask, typeof CVActionsTask.outs>(CVActionsTask.outs);

    actionManager: CVActionManager = null;

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
        return new ActionsTaskView(this);
    }

    activateTask()
    {   
        super.activateTask();
    }

    deactivateTask()
    {
        super.deactivateTask();
    }

    update()
    {
        const { ins } = this;
       

        /*if(!audioManager) {
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
                uris: {},
                captionUris: {},
                durations: {}
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

        if (clip && (ins.title.changed || ins.filepath.changed || ins.captionPath.changed)) {
            clip.name = ins.title.value;
            clip.uris[ELanguageType[ins.language.value]] = ins.filepath.value;
            clip.captionUris[ELanguageType[ins.language.value]] = ins.captionPath.value;
            audioManager.updateAudioClip(clip.id);
        }
        if (ins.isNarration.changed) {
            audioManager.narrationId = ins.isNarration.value ? clip.id : "";
        }*/

        return true;
    }

    protected onActiveDocument(previous: CVDocument, next: CVDocument)
    {
        super.onActiveDocument(previous, next);

        if (previous) {
            this.actionManager = null;
        }
        if (next) {
            this.actionManager = next.setup.actions;
        }
    }
}