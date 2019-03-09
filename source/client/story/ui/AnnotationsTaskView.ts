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
import { TaskView } from "../components/CVTask";

////////////////////////////////////////////////////////////////////////////////

@customElement("sv-annotations-task-view")
export default class AnnotationsTaskView extends TaskView<CVAnnotationsTask>
{
    protected render()
    {
        const item = this.activeItem;

        if (!item) {
            return html`<div class="sv-placeholder">Please select an item to edit its annotations</div>`;
        }

        const annotations = item.annotations;

        const inProps = annotations.ins;
        const modeProp = this.task.ins.mode;
        const annotationList = annotations.getAnnotations();
        const annotation = annotations.activeAnnotation;


        const detailView = annotation ? html`
            <sv-property-view .property=${inProps.style}></sv-property-view>
            <sv-property-view .property=${inProps.scale}></sv-property-view>
            <sv-property-view .property=${inProps.offset}></sv-property-view>
            <div class="sv-label">Title</div>
            <ff-line-edit name="title" text=${inProps.title.value} @change=${this.onTextEdit}></ff-line-edit>
            <div class="sv-label">Description</div>
            <ff-text-edit name="description" text=${inProps.description.value} @change=${this.onTextEdit}></ff-text-edit>` : null;

        return html`<div class="sv-commands">
            <ff-button text="Select" icon="select" index=${EAnnotationsTaskMode.Off} selectedIndex=${modeProp.value} @click=${this.onClickMode}></ff-button>       
            <ff-button text="Move" icon="move" index=${EAnnotationsTaskMode.Move} selectedIndex=${modeProp.value} @click=${this.onClickMode}></ff-button>       
            <ff-button text="Create" icon="create" index=${EAnnotationsTaskMode.Create} selectedIndex=${modeProp.value} @click=${this.onClickMode}></ff-button>       
            <ff-button text="Delete" icon="trash" ?disabled=${!annotation} @click=${this.onClickDelete}></ff-button>  
        </div>
        <div class="ff-flex-item-stretch">
            <div class="ff-flex-column ff-fullsize">
                <div class="sv-panel-section sv-scrollable" style="flex-basis: 30%">
                    <sv-annotation-list .data=${annotationList} .selectedItem=${annotation} @select=${this.onSelectAnnotation}></sv-annotation-list>
                </div>
                <ff-splitter direction="vertical"></ff-splitter>
                <div class="sv-panel-section sv-dialog sv-scrollable" style="flex-basis: 70%">
                    ${detailView}
                </div>
            </div>
        </div>`;
    }

    protected onTextEdit(event: ILineEditChangeEvent)
    {
        const annotations = this.task.activeAnnotations;

        const target = event.target;
        if (target.name === "title") {
            annotations.ins.title.setValue(event.detail.text);
        }
        else if (target.name === "description") {
            annotations.ins.description.setValue(event.detail.text);
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