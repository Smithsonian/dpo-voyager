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

import { customElement, html } from "@ff/ui/CustomElement";

import { IButtonClickEvent } from "@ff/ui/Button";

import "@ff/ui/LineEdit";
import { ILineEditChangeEvent } from "@ff/ui/LineEdit";

import "@ff/ui/TextEdit";
import "@ff/ui/Splitter";
import Notification from "@ff/ui/Notification";

import "./AnnotationList";
import { ISelectAnnotationEvent } from "./AnnotationList";

import CVAnnotationView from "../../components/CVAnnotationView";
import CVAnnotationsTask, { EAnnotationsTaskMode } from "../../components/CVAnnotationsTask";
import { TaskView } from "../../components/CVTask";
import { ELanguageStringType, DEFAULT_LANGUAGE } from "client/schema/common";

import sanitizeHtml from 'sanitize-html';
import CVMediaManager from "client/components/CVMediaManager";

////////////////////////////////////////////////////////////////////////////////
export const MAX_LEAD_CHARS = 200;

@customElement("sv-annotations-task-view")
export default class AnnotationsTaskView extends TaskView<CVAnnotationsTask>
{
    private _dragCounter = 0;
    private _leadLimit = MAX_LEAD_CHARS;
    private _leadCharCount = 0;

    protected sceneview : HTMLElement = null;
    
    protected connected()
    {
        super.connected();

        // get sceneview for cursor updates
        const explorer = (this.getRootNode() as Element).getElementsByTagName("voyager-explorer")[0];
        this.sceneview = explorer.shadowRoot.querySelector(".sv-scene-view") as HTMLElement;
        
        this.task.on("update", this.onUpdate, this);
        this.activeDocument.setup.language.ins.language.on("value", this.onUpdate, this);
    }

    protected disconnected()
    {
        this.activeDocument.setup.language.ins.language.off("value", this.onUpdate, this);
        this.task.off("update", this.onUpdate, this);

        // set cursor to grab when leaving
        this.sceneview.style.cursor = "grab";

        super.disconnected();
    }

    protected render()
    {
        if(!this.activeDocument) {
            return;
        }

        const node = this.activeNode;
        const annotations = node && node.getComponent(CVAnnotationView, true);
        const languageManager = this.activeDocument.setup.language;

        if (!annotations) {
            // set cursor to grab
            this.sceneview.style.cursor = "grab";

            return html`<div class="sv-placeholder">Please select a model to edit its annotations</div>`;
        }

        this.sceneview.style.cursor = this.task.ins.mode.value > 0 ? "default" : "grab";

        const inProps = annotations.ins;
        const audioProp = this.task.ins.audio;
        const modeProp = this.task.ins.mode;
        const annotationList = annotations.getAnnotations();

        const annotation = annotations.activeAnnotation;

        this._leadLimit = this._leadLimit == 0 ? 0 : (MAX_LEAD_CHARS - (inProps.image.value || inProps.audioId.value ? 50 : 0));
        this._leadCharCount = inProps.lead.value.length;
        const limitText = this._leadLimit == 0 ? "infinite" : this._leadLimit;
        const overLimit = this._leadCharCount > this._leadLimit && this._leadLimit != 0;

        const imagePropView = inProps.image.value.length > 0 ? html`
            <div class="sv-indent">
                <sv-property-view .property=${inProps.imageCredit}></sv-property-view>
                <sv-property-view .property=${inProps.imageAltText}></sv-property-view>
            </div>` : null;

        // <div class="sv-label">Title</div>
        // <ff-line-edit name="title" text=${inProps.title.value} @change=${this.onTextEdit}></ff-line-edit>
        // <div class="sv-label">Tags</div>
        // <ff-line-edit name="tags" text=${inProps.tags.value} @change=${this.onTextEdit}></ff-line-edit>

        const detailView = annotation ? html`<div class="ff-scroll-y ff-flex-column sv-detail-view">
            <sv-property-view .property=${inProps.style}></sv-property-view>
            <sv-property-view .property=${inProps.scale}></sv-property-view>
            <sv-property-view .property=${inProps.offset}></sv-property-view>
            <sv-property-view .property=${inProps.color}></sv-property-view>
            <sv-property-view id="image" .property=${inProps.image} @drop=${this.onDropFile} @dragenter=${this.onDragEnter} @dragover=${this.onDragOver} @dragleave=${this.onDragLeave}></sv-property-view>
            ${imagePropView}
            <sv-property-view .property=${audioProp}></sv-property-view>
            <sv-property-view .property=${inProps.marker}></sv-property-view>
            <sv-property-view .property=${languageManager.ins.language}></sv-property-view>
            <div class="sv-indent">
                <sv-property-view .property=${inProps.article}></sv-property-view>
                <sv-property-view .property=${inProps.tags}></sv-property-view>
                <sv-property-view .property=${inProps.title}></sv-property-view>
                <div class="sv-label" style="${overLimit ? "color: red" : ""}" @click=${(e)=>this.onClickLimit(e)}>Lead&nbsp&nbsp&nbsp${this._leadCharCount}/${limitText}</div>
                <ff-text-edit name="lead" text=${inProps.lead.value} rows=3 maxLength=${this._leadLimit} @change=${this.onTextEdit}></ff-text-edit>
            </div>
            <div class="sv-label">View Point</div>
            <div class="sv-commands">
                <ff-button text="Save" icon="camera" @click=${this.onSaveView}></ff-button>
                <ff-button text="View" ?disabled=${!annotation.data.viewId.length} icon="document" @click=${this.onRestoreView}></ff-button>
                <ff-button text="Delete" ?disabled=${!annotation.data.viewId.length} icon="trash" @click=${this.onDeleteView}></ff-button>
            </div>
        </div>` : null;

        return html`<div class="sv-commands">
            <ff-button text="Select" icon="select" index=${EAnnotationsTaskMode.Off} selectedIndex=${modeProp.value} @click=${this.onClickMode}></ff-button>       
            <ff-button text="Move" icon="move" index=${EAnnotationsTaskMode.Move} selectedIndex=${modeProp.value} @click=${this.onClickMode}></ff-button>       
            <ff-button text="Create" icon="create" index=${EAnnotationsTaskMode.Create} selectedIndex=${modeProp.value} @click=${this.onClickMode}></ff-button>       
            <ff-button text="Delete" icon="trash" ?disabled=${!annotation} @click=${this.onClickDelete}></ff-button>  
        </div>
        <div class="ff-flex-item-stretch">
            <div class="ff-flex-column ff-fullsize">
                <div class="ff-flex-row ff-group"><div class="sv-panel-header sv-task-item">${ELanguageStringType[DEFAULT_LANGUAGE]}</div><div class="sv-panel-header sv-task-item sv-item-border-l">${languageManager.nameString()}</div></div>
                <div class="ff-splitter-section" style="flex-basis: 30%">
                    <div class="ff-scroll-y ff-flex-column">
                        <sv-annotation-list .data=${annotationList} .selectedItem=${annotation} @select=${this.onSelectAnnotation}></sv-annotation-list>
                    </div>
                </div>
                <ff-splitter direction="vertical"></ff-splitter>
                <div class="ff-splitter-section" style="flex-basis: 70%">
                    ${detailView}
                </div>
            </div>
        </div>`;
    }

    protected onTextEdit(event: ILineEditChangeEvent)
    {
        const annotations = this.task.activeAnnotations;

        if (annotations) {
            const target = event.target;
            const text = event.detail.text;

            if (target.name === "lead") {
                annotations.ins.lead.setValue(sanitizeHtml(text, 
                    {
                        allowedTags: [ 'b', 'i', 'em', 'strong', 'a', 'sup', 'sub' ],
                        allowedAttributes: {
                          'a': [ 'href', 'target' ]
                        }
                    }
                ));

                annotations.activeAnnotation.leadChanged = true;
            }
        }
    }

    /**
     * User clicked a mode button.
     */
    protected onClickMode(event: IButtonClickEvent)
    {
        this.task.ins.mode.setValue(event.target.index);
    }

    /**
     * User clicked the delete button.
     */
    protected onClickDelete()
    {
        this.task.removeAnnotation();
    }

    /**
     * User clicked the save view button.
     */
     protected onSaveView()
     {
         this.task.saveAnnotationView();
         this.requestUpdate();
     }

     /**
     * User clicked the restore view button.
     */
      protected onRestoreView()
      {
          this.task.restoreAnnotationView();
      }

      /**
     * User clicked the delete view button.
     */
     protected onDeleteView()
     {
         this.task.deleteAnnotationView();
         this.requestUpdate();
     }

      /**
     * SUPER SECRET LIMIT OVERRIDE (shhh!)
     */
      protected onClickLimit(e: MouseEvent)
      {
        if(e.ctrlKey && e.shiftKey) {
            this._leadLimit = 0;
            (this.getElementsByTagName("ff-text-edit")[0] as HTMLElement).blur();
            this.requestUpdate();
        }
      }

    /**
     * User clicked an entry in the annotation list.
     */
    protected onSelectAnnotation(event: ISelectAnnotationEvent)
    {
        if (this.task.activeAnnotations) {
            this.task.activeAnnotations.activeAnnotation = event.detail.annotation;
            this.task.ins.selection.set();
            
            const ins = this.task.activeAnnotations.ins;
            this._leadCharCount = ins.lead.value.length;
            this._leadLimit = MAX_LEAD_CHARS - (ins.image.value ? 100 : 0) - (ins.image.value || ins.audioId.value ? 50 : 0);
            if(this._leadCharCount > MAX_LEAD_CHARS && !event.detail.annotation.leadChanged) {
                this._leadLimit = 0;
            }
        }
    }

    /** Handle image file dropping **TODO: Merge with audio drop handler*/
    protected onDropFile(event: DragEvent)
    {
        event.preventDefault();
        let filename = "";
        let newFile : File = null;
        const imageProp = this.task.activeAnnotations.ins.image;

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

        if(filename.toLowerCase().endsWith(".jpg") || filename.toLowerCase().endsWith(".png")) {
            if(newFile !== null) {
                const mediaManager = this.system.getMainComponent(CVMediaManager);
                mediaManager.uploadFile(filename, newFile, mediaManager.root).then(() => imageProp.setValue(filename)).catch(e => {
                    Notification.show(`Image file upload failed.`, "warning");
                    imageProp.setValue("");
                });
            }
            else {
                this.task.activeAnnotations.ins.image.setValue(filename);
            }
        }
        else {
            Notification.show(`Unable to load - Only .jpg and .png files are currently supported.`, "warning");
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