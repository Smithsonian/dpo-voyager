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

import CVDocument_old from "./CVDocument_old";

////////////////////////////////////////////////////////////////////////////////

export default class CVDocumentManager extends Component
{
    static readonly typeName: string = "CVDocumentManager";
    static readonly isSystemSingleton = true;

    protected static readonly ins = {
        activeDocument: types.Option("Documents.ActiveDocument", []),
    };

    protected static readonly outs = {
        activeDocument: types.Object("Documents.ActiveDocument", CVDocument_old),
        changedDocuments: types.Event("Documents.Changed"),
    };

    ins = this.addInputs(CVDocumentManager.ins);
    outs = this.addOutputs(CVDocumentManager.outs);

    get documents() {
        return this.getComponents(CVDocument_old);
    }
    get activeDocument() {
        return this.outs.activeDocument.value;
    }
    set activeDocument(document: CVDocument_old) {
        if (document !== this.activeDocument) {
            const index = this.documents.indexOf(document);
            this.ins.activeDocument.setValue(index + 1);
        }
    }

    create()
    {
        this.components.on(CVDocument_old, this.updateDocuments, this);
        this.updateDocuments();
    }

    update()
    {
        const ins = this.ins;

        if (ins.activeDocument.changed) {
            const index = ins.activeDocument.getValidatedValue() - 1;
            const nextDocument = index >= 0 ? this.documents[index] : null;
            const activeDocument = this.activeDocument;

            if (nextDocument !== activeDocument) {
                if (activeDocument) {
                    activeDocument.deactivateInnerGraph();
                }
                if (nextDocument) {
                    nextDocument.activateInnerGraph();
                }

                this.outs.activeDocument.setValue(nextDocument);
            }
        }

        return true;
    }

    dispose()
    {
        this.components.off(CVDocument_old, this.updateDocuments, this);
    }

    protected updateDocuments()
    {
        const documents = this.documents;
        const names = documents.map(document => document.displayName);
        names.unshift("(none)");
        this.ins.activeDocument.setOptions(names);

        let activeDocument = this.activeDocument;

        const index = activeDocument ?
            documents.indexOf(activeDocument) :
            Math.min(1, documents.length);

        if (index !== this.ins.activeDocument.getValidatedValue()) {
            this.ins.activeDocument.setValue(index);
        }

        this.outs.changedDocuments.set();
    }
}