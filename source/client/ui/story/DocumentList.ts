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

import System from "@ff/graph/System";

import List from "@ff/ui/List";
import "@ff/ui/Icon";

import { customElement, html, property, PropertyValues } from "@ff/ui/CustomElement";

import CVDocument from "../../components/CVDocument";
import CVDocumentProvider, { IActiveDocumentEvent, IDocumentsEvent } from "../../components/CVDocumentProvider";

////////////////////////////////////////////////////////////////////////////////

@customElement("sv-document-list")
class DocumentList extends List<CVDocument>
{
    @property({ attribute: false })
    system: System = null;

    protected documentProvider: CVDocumentProvider = null;
    protected documents: CVDocument[] = [];

    protected firstConnected()
    {
        super.firstConnected();
        this.classList.add("sv-document-list");

        this.documentProvider = this.system.getMainComponent(CVDocumentProvider);
    }

    protected connected()
    {
        super.connected();
        this.setDocuments(this.documentProvider.scopedComponents);
        this.documentProvider.on<IActiveDocumentEvent>("active-component", this.onUpdate, this);
        this.documentProvider.on<IDocumentsEvent>("scoped-components", this.onDocumentsEvent, this);
    }

    protected disconnected()
    {
        this.documentProvider.off<IDocumentsEvent>("scoped-components", this.onDocumentsEvent, this);
        this.documentProvider.off<IActiveDocumentEvent>("active-component", this.onUpdate, this);
        this.setDocuments([]);
        super.disconnected();
    }

    protected update(props: PropertyValues)
    {
        this.data = this.documents;
        super.update(props);
    }

    protected renderItem(component: CVDocument)
    {
        return html`<div class="ff-flex-row">
            <ff-text class="ff-ellipsis">${component.displayName}</ff-text></div>`;
    }

    protected isItemSelected(component: CVDocument)
    {
        return component === this.documentProvider.activeComponent;
    }

    protected onClickItem(event: MouseEvent, component: CVDocument)
    {
        this.documentProvider.activeComponent = component;
    }

    protected onDocumentsEvent()
    {
        this.setDocuments(this.documentProvider.scopedComponents);
    }

    protected setDocuments(documents: CVDocument[])
    {
        this.documents.forEach(doc => doc.off("change", this.onUpdate, this));
        this.documents = documents;
        this.documents.forEach(doc => doc.on("change", this.onUpdate, this));
    }
}