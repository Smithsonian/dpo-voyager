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

import "@ff/ui/Splitter";
import "@ff/ui/Button";

import "./PropertyView";

import CVMultimediaTask from "../../components/CVMultimediaTask";
import { TaskView, customElement, html, property } from "../../components/CVTask";
import List from "client/../../libs/ff-ui/source/List";
import { IMediaClip } from "client/schema/meta";
import Notification from "@ff/ui/Notification";
import CVMediaManager from "client/components/CVMediaManager";

////////////////////////////////////////////////////////////////////////////////

@customElement("sv-multimedia-task-view")
export default class MultimediaTaskView extends TaskView<CVMultimediaTask>
{
    private _dragCounter = 0;

    protected selectedIndex = -1;
    protected optionText = ["No", "Yes"];

    protected get mediaList()
    {
        const audioItems = this.task.audioManager.getAudioList().map(clip => ({ clip, type: "audio" as const }));
        const videoItems = this.task.videoManager.getVideoList().map(clip => ({ clip, type: "video" as const }));
        return [...audioItems, ...videoItems];
    }

    protected get selectedMediaItem()
    {
        const activeId = this.task.ins.activeId.value;
        return this.mediaList.find(item => item.clip.id === activeId) || null;
    }

    protected connected()
    {
        super.connected();
        this.task.on("update", this.onUpdate, this);
        this.activeDocument.setup.audio.outs.narrationPlaying.on("value", this.onUpdate, this);
    }

    protected disconnected()
    {
        this.activeDocument.setup.audio.outs.narrationPlaying.off("value", this.onUpdate, this);
        this.task.off("update", this.onUpdate, this);
        super.disconnected();
    }

    protected render()
    {
        if(!this.activeDocument || !this.task.audioManager || !this.task.videoManager) {
            return;
        }
        
        const ins = this.task.ins;
        const languageManager = this.activeDocument.setup.language;
        const selectedItem = this.selectedMediaItem;
        const isVideo = selectedItem?.type === "video";

        const narrationFlagClass = "sv-task-option-base-align";
        const mediaList = this.mediaList;
        const mediaElement = selectedItem?.clip || null;
        const narrationEnabled = !isVideo && !ins.isNarration.value && this.task.audioManager.getAudioList().some(clip => clip.id === this.task.audioManager.narrationId);
        const isPlaying = isVideo ? this.task.videoManager.outs.isPlaying.value : this.task.audioManager.outs.isPlaying.value;

        const detailView = mediaElement ? html`<div class="ff-scroll-y ff-flex-column sv-detail-view">
            <sv-property-view .property=${ins.title}></sv-property-view>
            <sv-property-view .property=${languageManager.ins.activeLanguage}></sv-property-view>
            <div class="sv-indent">
                <sv-property-view id="filename" .property=${ins.filepath} @drop=${this.onDropFile} @dragenter=${this.onDragEnter} @dragover=${this.onDragOver} @dragleave=${this.onDragLeave}></sv-property-view>
                <sv-property-view id="captionfile" .property=${ins.captionPath} @drop=${this.onDropFile} @dragenter=${this.onDragEnter} @dragover=${this.onDragOver} @dragleave=${this.onDragLeave}></sv-property-view>
                ${!isVideo ? html`<div class="sv-commands">
                    <sv-property-boolean .property=${ins.isNarration} .text=${this.optionText} .customLabelStyle=${narrationFlagClass} ?disabled=${narrationEnabled}></sv-property-boolean>
                </div>` : null}
                <div class="sv-commands">
                    <ff-button text="Play" @click=${this.onClickPlay}></ff-button>
                    <ff-button text="Stop" ?disabled=${!isPlaying} @click=${this.onClickStop}></ff-button>
                </div>
            </div>
        </div>` : null;

        return html`<div class="sv-commands">
            <ff-button text="${languageManager.getUILocalizedString("Create")} Audio" icon="create" @click=${this.onClickCreateAudio}></ff-button>
            <ff-button text="${languageManager.getUILocalizedString("Create")} Video" icon="create" @click=${this.onClickCreateVideo}></ff-button>
            <ff-button text="${languageManager.getUILocalizedString("Delete")}" icon="trash" ?disabled=${!mediaElement} @click=${this.onClickDelete}></ff-button>  
        </div>
        <div class="ff-flex-item-stretch">
            <div class="ff-flex-column ff-fullsize">
                <div class="ff-flex-row ff-group"><div class="sv-panel-header sv-task-item sv-task-item-full">${languageManager.getUILocalizedString("Multimedia Elements")}</div></div>
                <div class="ff-splitter-section" style="flex-basis: 30%">
                    <div class="ff-scroll-y ff-flex-column">
                        <sv-multimedia-list .data=${mediaList} .selectedItem=${selectedItem} @select=${this.onSelectMedia}></sv-multimedia-list>
                    </div>
                </div>
                <ff-splitter direction="vertical"></ff-splitter>
                <div class="ff-splitter-section" style="flex-basis: 70%">
                    ${detailView}
                </div>
            </div>
        </div>`;
    }

    protected onClickCreateAudio()
    {
        this.task.ins.createAudio.set();
    }

    protected onClickCreateVideo()
    {
        this.task.ins.createVideo.set();
    }

    protected onClickDelete()
    {
        this.task.ins.delete.set();
    }

    protected onClickPlay()
    {
        if(this.selectedMediaItem?.type !== "video") {
            this.activeDocument.setup.audio.setupAudio();
        }
        this.task.ins.play.set();
    }

    protected onClickStop()
    {
        this.task.ins.stop.set();
    }

    protected onSelectMedia(event: ISelectAudioEvent)
    {
        this.selectedIndex = event.detail.index;
        this.task.ins.activeId.setValue(event.detail.item ? event.detail.item.clip.id : "");
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
        const selectedType = this.selectedMediaItem?.type || "audio";
        const type = (id == "filename") ? selectedType : "subs";
        const fileProp = (type == "audio" || type == "video") ? this.task.ins.filepath : this.task.ins.captionPath;

        const ext = filename.toLowerCase().split(".").pop();
        if(type === "subs" && ext != "vtt"){
            Notification.show(`Unable to load - Only .vtt files are currently supported.`, "warning");
        }else if(type === "audio" && ["mp3","m4a","flac","ogg","wav"].indexOf(ext) === -1){
            Notification.show(`Unable to load - Unsupported audio format .${ext}`, "warning");
        }else if(type === "video" && ["mp4","webm","mov","m4v"].indexOf(ext) === -1){
            Notification.show(`Unable to load - Unsupported video format .${ext}`, "warning");
        }else{
            if(type === "audio" && ext === "m4a"){
                Notification.show(`.${ext} audio file are not supported by some browsers`, "info", 3000);
            }
            if(newFile !== null) {
                const mediaManager = this.system.getMainComponent(CVMediaManager);
                mediaManager.uploadFile(filename, newFile, mediaManager.root).then(() => fileProp.setValue(filename)).catch(() => {
                    Notification.show(`${selectedType === "video" ? "Video" : "Audio"} file upload failed.`, "warning");
                    fileProp.setValue("");
                });
            }
            else {
                fileProp.setValue(filename);
            }
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
    target: MultimediaList;
    detail: {
        item: IMultimediaItem;
        index: number;
    }
}

interface IMultimediaItem
{
    clip: IMediaClip;
    type: "audio" | "video";
}

@customElement("sv-multimedia-list")
export class MultimediaList extends List<IMultimediaItem>
{
    @property({ attribute: false })
    selectedItem: IMultimediaItem = null;

    protected firstConnected()
    {
        super.firstConnected();
        this.classList.add("sv-multimedia-list");
    }

    protected renderItem(item: IMultimediaItem)
    {
        const mediaLabel = item.type === "video" ? "Video" : "Audio";
        return html`<div class="ff-flex-row ff-group"><div class="sv-task-item">[${mediaLabel}] ${item.clip.name}</div></div>`;
    }

    protected isItemSelected(item: IMultimediaItem)
    {
        return item.clip.id === this.selectedItem?.clip?.id;
    }

    protected onClickItem(event: MouseEvent, item: IMultimediaItem, index: number)
    {
        this.dispatchEvent(new CustomEvent("select", {
            detail: { item, index }
        }));
    }

    protected onClickEmpty(event: MouseEvent)
    {
        this.dispatchEvent(new CustomEvent("select", {
            detail: { item: null, index: -1 }
        }));
    }
}