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

import { types } from "@ff/graph/propertyTypes";
import { IComponentEvent } from "@ff/graph/Node";

import { IActiveItemEvent, IActivePresentationEvent } from "../../explorer/components/CVPresentationController";
import NVItem from "../../explorer/nodes/NVItem";
import CVDocuments, { Document } from "../../explorer/components/CVDocuments";

import DocumentsTaskView from "../ui/DocumentsTaskView";
import CVTask from "./CVTask";

////////////////////////////////////////////////////////////////////////////////

const _inputs = {

};

export default class CVDocumentsTask extends CVTask
{
    static readonly text: string = "Documents";
    static readonly icon: string = "document";

    ins = this.addInputs<CVTask, typeof _inputs>(_inputs);

    private _activeDocuments: CVDocuments = null;
    private _activeDocument: Document = null;

    get activeDocuments() {
        return this._activeDocuments;
    }
    set activeDocuments(documents: CVDocuments) {
        if (documents !== this._activeDocuments) {
            this._activeDocuments = documents;
            this.emitUpdateEvent();
        }
    }

    get activeDocument() {
        return this._activeDocument;
    }
    set activeDocument(document: Document) {
        if (document !== this._activeDocument) {
            this._activeDocument = document;
            this.emitUpdateEvent();
        }
    }

    createView()
    {
        return new DocumentsTaskView(this);
    }

    activate()
    {
        super.activate();

        this.selectionController.selectedComponents.on(CVDocuments, this.onSelectDocuments, this);
    }

    deactivate()
    {
        this.selectionController.selectedComponents.off(CVDocuments, this.onSelectDocuments, this);

        super.deactivate();
    }

    protected onActiveItem(event: IActiveItemEvent)
    {
        //const prevDocuments = event.previous ? event.previous.documents : null;
        const nextDocuments = event.next ? event.next.documents : null;

        if (nextDocuments) {
            this.selectionController.selectComponent(nextDocuments);
        }

        this.activeDocuments = nextDocuments;
    }

    protected onSelectDocuments(event: IComponentEvent)
    {
        if (event.add && event.object.node instanceof NVItem) {
            this.presentationController.activeItem = event.object.node;
        }
    }
}