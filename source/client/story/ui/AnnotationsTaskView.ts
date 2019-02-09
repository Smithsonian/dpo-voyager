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

import CVAnnotationsTask, { EAnnotationsTaskMode } from "../components/CVAnnotationsTask";

import "./AnnotationList";
import { ISelectAnnotationEvent } from "./AnnotationList";

import TaskView from "./TaskView";

////////////////////////////////////////////////////////////////////////////////

@customElement("sv-annotations-task-view")
export default class AnnotationsTaskView extends TaskView
{
    protected task: CVAnnotationsTask;


    protected firstConnected()
    {
        super.firstConnected();
        this.classList.add("sv-annotations-task-view");
    }

    protected connected()
    {
        super.connected();

        this.task.ins.mode.on("value", this.performUpdate, this);
    }

    protected disconnected()
    {
        this.task.ins.mode.off("value", this.performUpdate, this);

        super.disconnected();
    }

    protected render()
    {
        const annotations = this.task.activeAnnotations;

        if (!annotations) {
            return html`<div class="sv-placeholder">Please select an item to edit its annotations</div>`;
        }

        const modeProp = this.task.ins.mode;
        const annotationList = annotations.getAnnotations();
        const annotation = annotations.activeAnnotation;

        const detailView = annotation ? html`<div class="sv-scrollable">
            <div class="sv-label">Title</div>
            <ff-line-edit name="title" text=${annotation.title} @change=${this.onTextEdit}></ff-line-edit>
            <div class="sv-label">Description</div>
            <ff-text-edit name="description" text=${annotation.description} @change=${this.onTextEdit}></ff-text-edit>
            <div class="sv-label">Groups</div>
        </div>` : null;

        return html`<div class="sv-commands">
            <ff-button text="Select" icon="select" index=${EAnnotationsTaskMode.Off} selectedIndex=${modeProp.value} @click=${this.onClickMode}></ff-button>       
            <ff-button text="Move" icon="move" index=${EAnnotationsTaskMode.Move} selectedIndex=${modeProp.value} @click=${this.onClickMode}></ff-button>       
            <ff-button text="Create" icon="create" index=${EAnnotationsTaskMode.Create} selectedIndex=${modeProp.value} @click=${this.onClickMode}></ff-button>       
            <ff-button text="Delete" icon="trash" ?disabled=${!annotation} @click=${this.onClickDelete}></ff-button>  
        </div>
        <div class="ff-flex-column" style="flex: 1 1 auto;">
            <sv-annotation-list class="sv-panel-section" .data=${annotationList} .selectedItem=${annotation} @select=${this.onSelectAnnotation}></sv-annotation-list>
            <ff-splitter direction="vertical"></ff-splitter>
            <div class="sv-panel-section">${detailView}</div>
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
            annotations.annotationUpdated(annotation);
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
        const annotations = this.task.activeAnnotations;

        if (annotations) {
            const annotation = annotations.activeAnnotation;
            if (annotation) {
                annotations.removeAnnotation(annotation);

            }
        }
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