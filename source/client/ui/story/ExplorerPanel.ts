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

import ExplorerApplication from "../../applications/ExplorerApplication";
import ExplorerView from "../explorer/MainView";

import CustomElement, { customElement, property } from "@ff/ui/CustomElement";

////////////////////////////////////////////////////////////////////////////////

@customElement("sv-explorer-panel")
export default class ExplorerPanel extends CustomElement
{
    @property({ attribute: false })
    application: ExplorerApplication;

    constructor(application?: ExplorerApplication)
    {
        super();
        this.application = application;

        if(application.system.getComponent("CVStandaloneFileManager", true)) {
            this.addEventListener('dragenter', this.onDragEnter);
            this.addEventListener('dragleave', this.onDragLeave);
            this.addEventListener('drop', this.onDragDrop);

            const fileInput = this.appendElement("input");
            fileInput.type = "file";
            fileInput.id = "fileInput";
        }
    }

    protected firstConnected()
    {
        this.classList.add("sv-panel", "sv-explorer-panel");
        this.appendElement(new ExplorerView(this.application));
    }

    protected onDragEnter(e: MouseEvent) {
        e.preventDefault();
        this.classList.add("sv-drop-zone");
    }

    protected onDragLeave(e: MouseEvent) {
        e.preventDefault();
        this.classList.remove("sv-drop-zone");
    }

    protected onDragDrop(e: MouseEvent) {
        e.preventDefault();
        this.classList.remove("sv-drop-zone");
    }
}