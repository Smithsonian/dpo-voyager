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

import { customElement, property, html, PropertyValues, TemplateResult } from "@ff/ui/CustomElement";

import CVDocumentProvider, { IActiveDocumentEvent } from "../components/CVDocumentProvider";
import CVDocument from "../components/CVDocument";
import CVScene from "../components/CVScene";

import SystemView from "@ff/scene/ui/SystemView";

////////////////////////////////////////////////////////////////////////////////

export { customElement, property, html, PropertyValues, TemplateResult };

export default class DocumentView extends SystemView
{
    protected activeDocument: CVDocument = null;
    protected activeScene: CVScene = null;

    protected get documentProvider() {
        return this.system.getMainComponent(CVDocumentProvider);
    }

    protected connected()
    {
        const provider = this.documentProvider;
        provider.on<IActiveDocumentEvent>("active-component", this.onActiveDocumentEvent, this);

        if (provider.activeComponent) {
            this.activeDocument = provider.activeComponent;
            this.activeScene = this.activeDocument.documentScene;
            this.onActiveDocument(null, provider.activeComponent);
        }
    }

    protected disconnected()
    {
        const provider = this.documentProvider;
        provider.off<IActiveDocumentEvent>("active-component", this.onActiveDocumentEvent, this);

        if (provider.activeComponent) {
            this.activeDocument = null;
            this.onActiveDocument(provider.activeComponent, null);
        }
    }

    protected onActiveDocument(previous: CVDocument, next: CVDocument)
    {
        this.requestUpdate();
    }

    protected onActiveDocumentEvent(event: IActiveDocumentEvent)
    {
        this.activeDocument = event.next;
        this.activeScene = event.next ? event.next.documentScene : null;

        this.onActiveDocument(event.previous, event.next);
    }
}