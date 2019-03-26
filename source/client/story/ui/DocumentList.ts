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

import List from "@ff/ui/List";
import "@ff/ui/Icon";

import { customElement, html, property, PropertyValues } from "@ff/ui/CustomElement";

import CVDocument from "../../explorer/components/CVDocument";
import CVDocumentProvider, { IActiveDocumentEvent } from "../../explorer/components/CVDocumentProvider";

////////////////////////////////////////////////////////////////////////////////

@customElement("sv-document-list")
class DocumentList extends List<CVDocument>
{
    @property({ attribute: false })
    system: System = null;

    protected documentProvider: CVDocumentProvider = null;
    protected selection: CSelection = null;

    protected firstConnected()
    {
        super.firstConnected();
        this.classList.add("sv-presentation-list");

        this.documentProvider = this.system.getMainComponent(CVDocumentProvider);
        this.selection = this.system.getMainComponent(CSelection);
    }

    protected connected()
    {
        super.connected();

        this.documentProvider.on<IActiveDocumentEvent>("active-component", this.onUpdate, this);
    }

    protected disconnected()
    {
        this.documentProvider.off<IActiveDocumentEvent>("active-component", this.onUpdate, this);

        super.disconnected();
    }

    protected update(props: PropertyValues)
    {
        this.data = this.documentProvider.scopedComponents;
        super.update(props);
    }

    protected renderItem(component: CVDocument)
    {
        const isActive = component === this.documentProvider.activeComponent;

        return html`<div class="ff-flex-row"><ff-icon name=${isActive ? "check" : "empty"}></ff-icon>
            <ff-text class="ff-ellipsis">${component.displayName}</ff-text></div>`;
    }

    protected isItemSelected(component: CVDocument)
    {
        return this.selection.selectedComponents.contains(component);
    }

    protected onClickItem(event: MouseEvent, component: CVDocument)
    {
        this.documentProvider.activeComponent = component;
        this.selection.selectComponent(component);
    }
}