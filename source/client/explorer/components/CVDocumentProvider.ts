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

import { Node, types } from "@ff/graph/Component";

import CComponentProvider, {
    EComponentScope,
    IActiveComponentEvent,
    IScopedComponentsEvent
} from "@ff/graph/components/CComponentProvider";

import CVDocument from "./CVDocument";

////////////////////////////////////////////////////////////////////////////////

export type IActiveDocumentEvent = IActiveComponentEvent<CVDocument>;
export type IDocumentsEvent = IScopedComponentsEvent;

export default class CVDocumentProvider extends CComponentProvider<CVDocument>
{
    static readonly typeName: string = "CVDocumentProvider";
    static readonly componentType = CVDocument;

    protected static readonly outs = {
        activeDocument: types.Object("Documents.Active", CVDocument),
        changedDocuments: types.Event("Documents.Changed"),
    };

    outs = this.addOutputs(CVDocumentProvider.outs);

    constructor(node: Node, id: string)
    {
        super(node, id);
        this.scope = EComponentScope.Node;
    }

    protected activateComponent(document: CVDocument)
    {
        document.ins.visible.setValue(true);
        document.ins.active.setValue(true);
    }

    protected deactivateComponent(document: CVDocument)
    {
        document.ins.visible.setValue(false);
        document.ins.active.setValue(false);

    }

    protected onActiveComponent(previous: CVDocument, next: CVDocument)
    {
        this.outs.activeDocument.setValue(next);
    }

    protected onScopedComponents()
    {
        this.outs.changedDocuments.set();
    }
}