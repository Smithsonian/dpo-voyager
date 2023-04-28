/**
 * 3D Foundation Project
 * Copyright 2019 Smithsonian Institution
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

import CVAnnotationView from "../../components/CVAnnotationView";
import CVAnnotationsTask, { EAnnotationsTaskMode } from "../../components/CVAnnotationsTask";
import { TaskView } from "../../components/CVTask";
import { ELanguageStringType, ELanguageType, TLanguageType, DEFAULT_LANGUAGE } from "client/schema/common";

import sanitizeHtml from 'sanitize-html';

////////////////////////////////////////////////////////////////////////////////

@customElement("sv-annotations-task-view")
export default class AnnotationsTaskView extends TaskView<CVAnnotationsTask>
{
    protected connected()
    {
        super.connected();
        this.task.on("update", this.onUpdate, this);
        this.task.ins.language.on("value", this.onUpdate, this);
    }

    protected disconnected()
    {
        this.task.ins.language.off("value", this.onUpdate, this);
        this.task.off("update", this.onUpdate, this);
        super.disconnected();
    }

    protected render()
    {
        const node = this.activeNode;
        const annotations = node && node.getComponent(CVAnnotationView, true);

        if (!annotations) {
            return html`<div class="sv-placeholder">Please select a model to edit its annotations</div>`;
        }

        const inProps = annotations.ins;
        const modeProp = this.task.ins.mode;
        const annotationList = annotations.getAnnotations();

        const annotation = annotations.activeAnnotation;

        // <div class="sv-label">Title</div>
        // <ff-line-edit name="title" text=${inProps.title.value} @change=${this.onTextEdit}></ff-line-edit>
        // <div class="sv-label">Tags</div>
        // <ff-line-edit name="tags" text=${inProps.tags.value} @change=${this.onTextEdit}></ff-line-edit>

        const detailView = annotation ? html`<div class="ff-scroll-y ff-flex-column sv-detail-view">
            <sv-property-view .property=${inProps.style}></sv-property-view>
            <sv-property-view .property=${inProps.scale}></sv-property-view>
            <sv-property-view .property=${inProps.offset}></sv-property-view>
            <sv-property-view .property=${inProps.color}></sv-property-view>
            <sv-property-view .property=${inProps.image}></sv-property-view>
            <sv-property-view .property=${inProps.marker}></sv-property-view>
            <sv-property-view .property=${this.task.ins.language}></sv-property-view>
            <div class="sv-indent">
                <sv-property-view .property=${inProps.article}></sv-property-view>
                <sv-property-view .property=${inProps.tags}></sv-property-view>
                <sv-property-view .property=${inProps.title}></sv-property-view>
                <div class="sv-label">Lead</div>
                <ff-text-edit name="lead" text=${inProps.lead.value} @change=${this.onTextEdit}></ff-text-edit>
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
                <div class="ff-flex-row ff-group"><div class="sv-panel-header sv-task-item">${ELanguageStringType[DEFAULT_LANGUAGE]}</div><div class="sv-panel-header sv-task-item sv-item-border-l">${ELanguageStringType[ELanguageType[this.task.ins.language.value] as TLanguageType]}</div></div>
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
                          'a': [ 'href' ]
                        }
                    }
                ));
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
     * User clicked an entry in the annotation list.
     */
    protected onSelectAnnotation(event: ISelectAnnotationEvent)
    {
        if (this.task.activeAnnotations) {
            this.task.activeAnnotations.activeAnnotation = event.detail.annotation;
        }
    }
}