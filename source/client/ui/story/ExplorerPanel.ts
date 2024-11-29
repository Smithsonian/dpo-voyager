/**
 * 3D Foundation Project
 * Copyright 2024 Smithsonian Institution
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
import ExplorerLockToolbar from "./ExplorerLockToolbar";
import { relative } from "path";
import { IStoryApplicationProps } from "client/applications/StoryApplication";
import { SimpleDropzone } from 'simple-dropzone';
import CVMediaManager from "client/components/CVMediaManager";
import CVStoryApplication from "client/components/CVStoryApplication";

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
        const storyApp: CVStoryApplication = application.system.getComponent(CVStoryApplication);

        if(storyApp && storyApp.dragdrop === true) {
            this.addEventListener('dragenter', this.onDragEnter);
            this.addEventListener('dragleave', this.onDragLeave);
            this.addEventListener('drop', this.onDragDrop);

            const fileInput = this.appendElement("input");
            fileInput.type = "file";
            fileInput.id = "fileInput";
            fileInput.style.display = "none";

            const dropZone = new SimpleDropzone(this, fileInput);

            const mediaManager = application.system.getComponent(CVMediaManager);
            dropZone.on('drop', ({files}: any) => mediaManager.ingestFiles(files));
        }
    }

    protected firstConnected()
    {
        this.classList.add("sv-panel", "sv-explorer-panel");

        const lockableContainer = this.createElement("div", {position: "relative", flex: "1 1 auto", display: "flex", flexDirection: "row", marginLeft: "auto", marginRight: "auto", width: "100%"});
        
        this.appendElement(new ExplorerLockToolbar(lockableContainer));
        this.appendElement(lockableContainer);
        
        const explorerWrapper = document.createElement("div");
        lockableContainer.appendChild(explorerWrapper);
        explorerWrapper.appendChild(new ExplorerView(this.application));
    }

    protected onDragEnter(e: MouseEvent) {
        if(e.currentTarget != this || this.contains(e.relatedTarget as HTMLElement)) {
            return;
        }

        e.preventDefault();
        this.classList.add("sv-drop-zone");
    }

    protected onDragLeave(e: MouseEvent) {
        if(e.currentTarget != this || this.contains(e.relatedTarget as HTMLElement) || 
            (e.relatedTarget && (e.relatedTarget as HTMLElement).getRootNode() instanceof ShadowRoot)) {
            return;
        }

        e.preventDefault();
        this.classList.remove("sv-drop-zone");
    }

    protected onDragDrop(e: MouseEvent) {
        e.preventDefault();
        this.classList.remove("sv-drop-zone");
    }
}