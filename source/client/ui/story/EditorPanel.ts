/**
 * 3D Foundation Project
 * Copyright 2019 Smithsonian Institution
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

import SystemView, { System, customElement } from "@ff/scene/ui/SystemView";

import ArticleEditor from "./ArticleEditor";

////////////////////////////////////////////////////////////////////////////////

@customElement("sv-editor-panel")
export default class EditorPanel extends SystemView
{
    constructor(system: System)
    {
        super(system);
        this._editor = new ArticleEditor(system);
    }

    get editor() {
        return this._editor;
    }

    private _editor: ArticleEditor;

    protected firstConnected()
    {
        super.firstConnected();
        this.classList.add("sv-panel", "sv-editor-panel");

        this.appendElement(this._editor);
    }
}