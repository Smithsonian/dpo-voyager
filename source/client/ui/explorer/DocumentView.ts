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
import SystemView from "@ff/scene/ui/SystemView";

import CVDocumentProvider, { IActiveDocumentEvent } from "../../components/CVDocumentProvider";
import CVDocument from "../../components/CVDocument";
import CVScene from "../../components/CVScene";

////////////////////////////////////////////////////////////////////////////////

export { customElement, property, html, PropertyValues, TemplateResult };

export default class DocumentView extends SystemView
{
    protected activeDocument: CVDocument = null;

    protected get documentProvider() {
        return this.system.getMainComponent(CVDocumentProvider);
    }
    protected get activeScene() {
        return this.activeDocument.documentScene;
    }

    protected connected()
    {
        const provider = this.documentProvider;
        provider.on<IActiveDocumentEvent>("active-component", this.onActiveDocumentEvent, this);

        const document = provider.activeComponent;
        if (document) {
            this.activeDocument = document;
            const scene = document.documentScene;

            this.onActiveDocument(null, document);

            if (scene) {
                this.onActiveScene(null, scene);
            }
        }
    }

    protected disconnected()
    {
        const provider = this.documentProvider;
        provider.off<IActiveDocumentEvent>("active-component", this.onActiveDocumentEvent, this);

        const document = provider.activeComponent;
        if (document) {
            this.activeDocument = null;

            this.onActiveDocument(document, null);

            const scene = document.documentScene;
            if (scene) {
                this.onActiveScene(scene, null);
            }
        }
    }

    protected onActiveDocument(previous: CVDocument, next: CVDocument)
    {
    }

    protected onActiveScene(previous: CVScene, next: CVScene)
    {
    }

    protected onActiveDocumentEvent(event: IActiveDocumentEvent)
    {
        const prev = event.previous;
        const next = event.next;

        this.activeDocument = next;

        this.onActiveDocument(prev, next);
        this.onActiveScene(prev && prev.documentScene, next && next.documentScene);
    }
}