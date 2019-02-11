/**
 * 3D Foundation Project
 * Copyright 2018 Smithsonian Institution
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

import "./AnnotationList";
import { ISelectAnnotationEvent } from "./AnnotationList";

import CVAnnotationsTask, { EAnnotationsTaskMode } from "../components/CVAnnotationsTask";
import TaskView from "./TaskView";

////////////////////////////////////////////////////////////////////////////////

@customElement("sv-annotations-task-view")
export default class AnnotationsTaskView extends TaskView
{
    protected task: CVAnnotationsTask;


    protected render()
    {
        const annotations = this.task.activeAnnotations;

        if (!annotations) {
            return html`<div class="sv-placeholder">Please select an item to edit its annotations</div>`;
        }

        const modeProp = this.task.ins.mode;
        const annotationList = annotations.getAnnotations();
        const annotation = annotations.activeAnnotation;

        const detailView = annotation ? html`<div class="sv-label">Title</div>
            <ff-line-edit name="title" text=${annotation.title} @change=${this.onTextEdit}></ff-line-edit>
            <div class="sv-label">Description</div>
            <ff-text-edit name="description" text=${annotation.description} @change=${this.onTextEdit}></ff-text-edit>
            <div class="sv-label">Groups</div>` : null;

        return html`<div class="sv-commands">
            <ff-button text="Select" icon="select" index=${EAnnotationsTaskMode.Off} selectedIndex=${modeProp.value} @click=${this.onClickMode}></ff-button>       
            <ff-button text="Move" icon="move" index=${EAnnotationsTaskMode.Move} selectedIndex=${modeProp.value} @click=${this.onClickMode}></ff-button>       
            <ff-button text="Create" icon="create" index=${EAnnotationsTaskMode.Create} selectedIndex=${modeProp.value} @click=${this.onClickMode}></ff-button>       
            <ff-button text="Delete" icon="trash" ?disabled=${!annotation} @click=${this.onClickDelete}></ff-button>  
        </div>
        <div class="ff-flex-item-stretch">
            <div class="ff-flex-column ff-fullsize">
                <div class="sv-panel-section sv-scrollable">
                    <sv-annotation-list .data=${annotationList} .selectedItem=${annotation} @select=${this.onSelectAnnotation}></sv-annotation-list>
                </div>
                <ff-splitter direction="vertical"></ff-splitter>
                <div class="sv-panel-section sv-dialog sv-scrollable">
                    ${detailView}
                </div>
            </div>
        </div>`;
    }

    protected onTextEdit(event: ILineEditChangeEvent)
    {
        const annotations = this.task.activeAnnotations;
        const annotation = annotations ? annotations.activeAnnotation : null;

        if (annotation) {
            const target = event.target;
            if (target.name === "title") {
                annotation.title = event.detail.text;
            }
            else if (target.name === "description") {
                annotation.description = event.detail.text;
            }

            this.performUpdate();
            annotations.updateAnnotation(annotation);
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
     * User clicked an entry in the annotation list.
     */
    protected onSelectAnnotation(event: ISelectAnnotationEvent)
    {
        if (this.task.activeAnnotations) {
            this.task.activeAnnotations.activeAnnotation = event.detail.annotation;
        }
    }
}