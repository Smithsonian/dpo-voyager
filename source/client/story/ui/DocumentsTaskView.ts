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

import "./DocumentList";
import { ISelectDocumentEvent } from "./DocumentList";

import CVDocumentsTask from "../components/CVDocumentsTask";
import TaskView from "./TaskView";

////////////////////////////////////////////////////////////////////////////////

@customElement("sv-documents-task-view")
export default class DocumentsTaskView extends TaskView
{
    protected task: CVDocumentsTask;

    protected render()
    {
        const documents = this.task.activeDocuments;

        if (!documents) {
            return html`<div class="sv-placeholder">Please select an item to edit its documents</div>`;
        }

        const documentList = documents.getDocuments();
        const document = this.task.activeDocument;

        const detailView = document ? html`` : null;

        return html`<div class="sv-commands">
            <ff-button text="Create" icon="create" @click=${this.onClickCreate}></ff-button>       
            <ff-button text="Delete" icon="trash" ?disabled=${!document} @click=${this.onClickDelete}></ff-button>  
        </div>
        <div class="ff-flex-item-stretch">
            <div class="ff-flex-column ff-fullsize">
                <sv-document-list .data=${documentList} .selectedItem=${document} @select=${this.onSelectDocument}></sv-document-list>
            </div>
            <ff-splitter direction="vertical"></ff-splitter>
            <div class="sv-panel-section sv-dialog sv-scrollable">
                ${detailView}
            </div>
        </div>`
    }

    protected onClickCreate()
    {

    }

    protected onClickDelete()
    {

    }

    protected onSelectDocument(event: ISelectDocumentEvent)
    {
        if (this.task.activeDocuments) {
            this.task.activeDocument = event.detail.document;
        }
    }
}