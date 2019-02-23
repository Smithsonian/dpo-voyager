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

import System from "@ff/graph/System";
import CSelection from "@ff/graph/components/CSelection";
import CDocument from "@ff/graph/components/CDocument";
import CDocumentManager, { IActiveDocumentEvent } from "@ff/graph/components/CDocumentManager";

import List from "@ff/ui/List";
import "@ff/ui/Icon";

import { customElement, html, property, PropertyValues } from "@ff/ui/CustomElement";

////////////////////////////////////////////////////////////////////////////////

@customElement("sv-document-list")
class DocumentList extends List<CDocument>
{
    @property({ attribute: false })
    system: System = null;

    protected documentManager: CDocumentManager = null;
    protected selection: CSelection = null;

    protected firstConnected()
    {
        super.firstConnected();
        this.classList.add("sv-presentation-list");

        this.documentManager = this.system.getMainComponent(CDocumentManager);
        this.selection = this.system.getMainComponent(CSelection);
    }

    protected connected()
    {
        super.connected();

        this.system.components.on(CDocument, this.performUpdate, this);
        this.selection.selectedComponents.on(CDocument, this.performUpdate, this);
        this.documentManager.on<IActiveDocumentEvent>("active-document", this.performUpdate, this);
    }

    protected disconnected()
    {
        this.system.components.off(CDocument, this.performUpdate, this);
        this.selection.selectedComponents.off(CDocument, this.performUpdate, this);
        this.documentManager.off<IActiveDocumentEvent>("active-document", this.performUpdate, this);

        super.disconnected();
    }

    protected update(props: PropertyValues)
    {
        this.data = this.system.components.getArray(CDocument);
        super.update(props);
    }

    protected renderItem(component: CDocument)
    {
        const isActive = component === this.documentManager.activeDocument;
        return html`<div class="ff-flex-row"><ff-icon name=${isActive ? "check" : "empty"}></ff-icon>
            <ff-text class="ff-ellipsis">${component.displayName}</ff-text></div>`;
    }

    protected isItemSelected(component: CDocument)
    {
        return this.selection.selectedComponents.contains(component);
    }

    protected onClickItem(event: MouseEvent, component: CDocument)
    {
        this.documentManager.activeDocument = component;
        this.selection.selectComponent(component);
    }
}