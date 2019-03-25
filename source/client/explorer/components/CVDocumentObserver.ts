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

import Component, { types } from "@ff/graph/Component";

import CVDocument from "./CVDocument";
import CVDocumentProvider, { IActiveDocumentEvent } from "./CVDocumentProvider";

////////////////////////////////////////////////////////////////////////////////

export default class CVDocumentObserver extends Component
{
    static readonly tagName: string = "CVDocumentObserver";

    protected activeDocument: CVDocument = null;

    protected get documentProvider() {
        return this.getGraphComponent(CVDocumentProvider);
    }

    protected startObserving()
    {
        const provider = this.documentProvider;
        provider.on<IActiveDocumentEvent>("active-component", this.onActiveDocumentEvent, this);

        if (provider.activeComponent) {
            this.activeDocument = provider.activeComponent;
            this.onActiveDocument(null, provider.activeComponent);
        }
    }

    protected stopObserving()
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
    }

    protected onActiveDocumentEvent(event: IActiveDocumentEvent)
    {
        this.activeDocument = event.next;
        this.onActiveDocument(event.previous, event.next);
    }
}