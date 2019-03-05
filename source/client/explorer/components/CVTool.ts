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
import CDocumentManager from "@ff/graph/components/CDocumentManager";

import CustomElement, { customElement, property, html } from "@ff/ui/CustomElement";

import CVTools from "../components/CVTools";

////////////////////////////////////////////////////////////////////////////////

export default class CVTool extends Component
{
    static readonly typeName: string = "CVTool";

    createView(): HTMLElement
    {
        return null;
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

    get tools() {
        return this.tool.system.getMainComponent(CVTools);
    }
    get documentManager() {
        return this.tool.system.getMainComponent(CDocumentManager);
    }
    get activeDocument() {
        return this.documentManager.activeDocument;
    }

    protected firstConnected()
    {
        this.classList.add("sv-tool-view");
    }
}