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

import NVItem from "../../explorer/nodes/NVItem";
import CVAnnotationsTask, { EAnnotationsTaskMode } from "../components/CVAnnotationsTask";
import CVAnnotations, { Annotation } from "../../explorer/components/CVAnnotations";

import "./AnnotationList";
import { ISelectAnnotationEvent } from "./AnnotationList";
import "@ff/ui/LineEdit";
import "@ff/ui/TextEdit";

import TaskView from "./TaskView";

////////////////////////////////////////////////////////////////////////////////

@customElement("sv-annotations-task-view")
export default class AnnotationsTaskView extends TaskView
{
    protected task: CVAnnotationsTask;
    protected activeAnnotations: CVAnnotations = null;
    protected selectedAnnotation: Annotation = null;

    protected setActiveItem(item: NVItem)
    {
        this.activeAnnotations = item ? item.annotations : null;
        this.selectedAnnotation = null;

        this.performUpdate();
    }

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
        if (!this.activeAnnotations) {
            return html`<div class="sv-placeholder">Please select an item to edit its annotations</div>`;
        }

        const modeProp = this.task.ins.mode;
        const annotations = this.activeAnnotations.getAnnotations();
        const annotation = this.selectedAnnotation;

        const detailView = annotation ? html`<div>
            <div class="sv-label">Title</div>
            <ff-line-edit text=${annotation.title}></ff-line-edit>
            <div class="sv-label">Description</div>
            <ff-text-edit text=${annotation.description}></ff-text-edit>
            <div class="sv-label">Groups</div>
        </div>` : null;

        return html`<div class="ff-flex-row ff-flex-wrap">
            <ff-button text="Off" index=${EAnnotationsTaskMode.Off} selectedIndex=${modeProp.value} @click=${this.onClickMode}></ff-button>       
            <ff-button text="Move" index=${EAnnotationsTaskMode.Move} selectedIndex=${modeProp.value} @click=${this.onClickMode}></ff-button>       
            <ff-button text="Create" index=${EAnnotationsTaskMode.Create} selectedIndex=${modeProp.value} @click=${this.onClickMode}></ff-button>       
            <ff-button text="Delete" @click=${this.onClickDelete}></ff-button>  
        </div>
        <sv-annotation-list .data=${annotations} .selectedItem=${annotation} @select=${this.onSelectAnnotation}></sv-annotation-list>
        ${detailView}`;
    }

    protected onClickMode(event: IButtonClickEvent)
    {
        this.task.ins.mode.setValue(event.target.index);
    }

    protected onClickDelete()
    {

    }

    protected onSelectAnnotation(event: ISelectAnnotationEvent)
    {
        this.selectedAnnotation = event.detail.annotation;
        this.performUpdate();
    }
}