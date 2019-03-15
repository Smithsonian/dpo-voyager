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

import {
    customElement,
    property,
    html,
    PropertyValues,
    TemplateResult
} from "@ff/ui/CustomElement";

import CVDocumentManager from "../components/CVDocumentManager";
import CVDocument_old from "../components/CVDocument_old";

import SystemView from "@ff/scene/ui/SystemView";

////////////////////////////////////////////////////////////////////////////////

export { customElement, property, html, PropertyValues, TemplateResult };

export default class DocumentView extends SystemView
{
    private _activeDocument: CVDocument_old = null;

    protected get documentManager() {
        return this.system.getMainComponent(CVDocumentManager);
    }
    protected get activeDocument() {
        return this._activeDocument;
    }

    protected connected()
    {
        const activeDocumentProp = this.documentManager.outs.activeDocument;
        activeDocumentProp.on("value", this._onActiveDocument, this);
        this._onActiveDocument(activeDocumentProp.value);
    }

    protected disconnected()
    {
        this._onActiveDocument(null);
        this.documentManager.outs.activeDocument.off("value", this._onActiveDocument, this);
    }

    protected onActiveDocument(previous: CVDocument_old, next: CVDocument_old)
    {
    }

    private _onActiveDocument(document: CVDocument_old)
    {
        if (document !== this._activeDocument) {
            this.onActiveDocument(this._activeDocument, document);
            this._activeDocument = document;
        }
    }
}