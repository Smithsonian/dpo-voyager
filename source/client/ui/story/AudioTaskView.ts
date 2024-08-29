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

import "@ff/ui/Splitter";
import "@ff/ui/Button";

import "./PropertyView";

import CVAudioTask from "../../components/CVAudioTask";
import { TaskView, customElement, html, property } from "../../components/CVTask";
import List from "client/../../libs/ff-ui/source/List";
import { IAudioClip } from "client/schema/meta";
import Notification from "@ff/ui/Notification";
import CVMediaManager from "client/components/CVMediaManager";

////////////////////////////////////////////////////////////////////////////////

@customElement("sv-audio-task-view")
export default class AudioTaskView extends TaskView<CVAudioTask>
{
    private _dragCounter = 0;

    protected selectedIndex = -1;
    protected optionText = ["No", "Yes"];

    protected connected()
    {
        super.connected();
        this.task.on("update", this.onUpdate, this);
        this.activeDocument.setup.audio.outs.narrationPlaying.on("value", this.onUpdate, this);

        //this.addEventListener("drop", this.onDropFile);
    }

    protected disconnected()
    {
        //this.removeEventListener("drop", this.onDropFile);

        this.activeDocument.setup.audio.outs.narrationPlaying.off("value", this.onUpdate, this);
        this.task.off("update", this.onUpdate, this);
        super.disconnected();
    }

    protected render()
    {
        if(!this.task.audioManager || !this.activeDocument) {
            return;
        }
        
        const ins = this.task.ins;
        const languageManager = this.activeDocument.setup.language;

        const narrationFlagClass = "sv-task-option-base-align";
        const audio = this.task.audioManager;
        const audioList = audio.getAudioList();
        const audioElement = audio.getAudioClip(ins.activeId.value);
        const narrationEnabled = !ins.isNarration.value && audioList.some(clip => clip.id === this.task.audioManager.narrationId);

        const detailView = audioElement ? html`<div class="ff-scroll-y ff-flex-column sv-detail-view">
            <sv-property-view .property=${ins.title}></sv-property-view>
            <sv-property-view .property=${languageManager.ins.language}></sv-property-view>
            <div class="sv-indent">
                <sv-property-view id="filename" .property=${ins.filepath} @drop=${this.onDropFile} @dragenter=${this.onDragEnter} @dragover=${this.onDragOver} @dragleave=${this.onDragLeave}></sv-property-view>
                <sv-property-view id="captionfile" .property=${ins.captionPath} @drop=${this.onDropFile} @dragenter=${this.onDragEnter} @dragover=${this.onDragOver} @dragleave=${this.onDragLeave}></sv-property-view>
                <div class="sv-commands">
                    <sv-property-boolean .property=${ins.isNarration} .text=${this.optionText} .customLabelStyle=${narrationFlagClass} ?disabled=${narrationEnabled}></sv-property-boolean>
                </div>
                <div class="sv-commands">
                    <ff-button text="Play" @click=${this.onClickPlay}></ff-button>
                    <ff-button text="Stop" ?disabled=${!this.task.audioManager.outs.isPlaying.value} @click=${this.onClickStop}></ff-button>
                </div>
            </div>
        </div>` : null;

        return html`<div class="sv-commands">
            <ff-button text="Create" icon="create" @click=${this.onClickCreate}></ff-button>       
            <ff-button text="Delete" icon="trash" ?disabled=${!audioElement} @click=${this.onClickDelete}></ff-button>  
        </div>
        <div class="ff-flex-item-stretch">
            <div class="ff-flex-column ff-fullsize">
                <div class="ff-flex-row ff-group"><div class="sv-panel-header sv-task-item sv-task-item-full">Audio Elements</div></div>
                <div class="ff-splitter-section" style="flex-basis: 30%">
                    <div class="ff-scroll-y ff-flex-column">
                        <sv-audio-list .data=${audioList} .selectedItem=${audioElement} @select=${this.onSelectAudio}></sv-annotation-list>
                    </div>
                </div>
                <ff-splitter direction="vertical"></ff-splitter>
                <div class="ff-splitter-section" style="flex-basis: 70%">
                    ${detailView}
                </div>
            </div>
        </div>`;
    }

    protected onClickCreate()
    {
        this.task.ins.create.set();
    }

    protected onClickDelete()
    {
        this.task.ins.delete.set();
    }

    protected onClickPlay()
    {
        this.activeDocument.setup.audio.setupAudio();
        this.task.ins.play.set();
    }

    protected onClickStop()
    {
        this.task.ins.stop.set();
    }

    protected onSelectAudio(event: ISelectAudioEvent)
    {
        this.selectedIndex = event.detail.index;
        this.task.ins.activeId.setValue(event.detail.clip ? event.detail.clip.id : "");
    }

    protected onDropFile(event: DragEvent)
    {
        event.preventDefault();
        let filename = "";
        let newFile : File = null;

        const element = event.target as HTMLElement;
        if(element.tagName != "INPUT") {
            return;
        }


        if(event.dataTransfer.files.length === 1) {
            newFile = event.dataTransfer.files.item(0);
            filename = newFile.name;
        }
        else {
            const filepath = event.dataTransfer.getData("text/plain");
            if(filepath.length > 0) {
                filename = filepath;
            }
        }

        const id = element.parentElement.parentElement.id;
        const fileProp = id == "filename" ? this.task.ins.filepath : this.task.ins.captionPath;
        const extText = id == "filename" ? ".mp3" : ".vtt";

        if(filename.toLowerCase().endsWith(extText)) {
            if(newFile !== null) {
                const mediaManager = this.system.getMainComponent(CVMediaManager);
                mediaManager.uploadFile(filename, newFile, mediaManager.root).then(() => fileProp.setValue(filename)).catch(e => {
                    Notification.show(`Audio file upload failed.`, "warning");
                    fileProp.setValue("");
                });
            }
            else {
                fileProp.setValue(filename);
            }
        }
        else {
            Notification.show(`Unable to load - Only ${extText} files are currently supported.`, "warning");
        }

        element.classList.remove("sv-drop-zone");
        this._dragCounter = 0;
    }

    protected onDragEnter(event: DragEvent)
    {
        const element = event.target as HTMLElement;

        if(element.tagName == "INPUT") {
            element.classList.add("sv-drop-zone");

            event.preventDefault();
            this._dragCounter++;
        }
    }

    protected onDragOver(event: DragEvent)
    {
        event.preventDefault();
    }

    protected onDragLeave(event: DragEvent)
    {
        const element = event.target as HTMLElement;
        
        if(element.tagName == "INPUT") {
            this._dragCounter--;
            if(this._dragCounter === 0) {
                element.classList.remove("sv-drop-zone");
            }
        }
    }
}

////////////////////////////////////////////////////////////////////////////////

interface ISelectAudioEvent extends CustomEvent
{
    target: AudioList;
    detail: {
        clip: IAudioClip;
        index: number;
    }
}

@customElement("sv-audio-list")
export class AudioList extends List<IAudioClip>
{
    @property({ attribute: false })
    selectedItem: IAudioClip = null;

    protected firstConnected()
    {
        super.firstConnected();
        this.classList.add("sv-audio-list");
    }

    protected renderItem(item: IAudioClip)
    {
        return html`<div class="ff-flex-row ff-group"><div class="sv-task-item">${item.name}</div></div>`;
    }

    protected isItemSelected(item: IAudioClip)
    {
        return item === this.selectedItem;
    }

    protected onClickItem(event: MouseEvent, item: IAudioClip, index: number)
    {
        this.dispatchEvent(new CustomEvent("select", {
            detail: { clip: item, index }
        }));
    }

    protected onClickEmpty(event: MouseEvent)
    {
        this.dispatchEvent(new CustomEvent("select", {
            detail: { clip: null, index: -1 }
        }));
    }
}
