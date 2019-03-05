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
import CDocumentManager, { IActiveDocumentEvent } from "@ff/graph/components/CDocumentManager";

import CustomElement, { customElement, property, html } from "@ff/ui/CustomElement";

import CVTools from "../components/CVTools";

////////////////////////////////////////////////////////////////////////////////

export default class CVTool extends Component
{
    static readonly typeName: string = "CVTool";

    get tools() {
        return this.system.getMainComponent(CVTools);
    }
    get documentManager() {
        return this.system.getMainComponent(CDocumentManager);
    }
    get activeDocument() {
        return this.documentManager.activeDocument;
    }

    create()
    {
        super.create();
        this.documentManager.on<IActiveDocumentEvent>("active-document", this.onActiveDocument, this);
        this.onActiveDocument({ type: "active-document", previous: null, next: this.activeDocument });
    }

    dispose()
    {
        this.onActiveDocument({ type: "active-document", previous: this.activeDocument, next: null });
        this.documentManager.off<IActiveDocumentEvent>("active-document", this.onActiveDocument, this);
        super.dispose();
    }

    createView(): HTMLElement
    {
        return null;
    }

    protected onActiveDocument(event: IActiveDocumentEvent)
    {
    }
}

////////////////////////////////////////////////////////////////////////////////

export { customElement, html };

export class ToolView<T extends CVTool> extends CustomElement
{
    @property({ attribute: false })
    tool: T = null;

    constructor(tool?: T)
    {
        super();
        this.tool = tool;
    }

    protected firstConnected()
    {
        this.classList.add("sv-tool-view");
    }
}