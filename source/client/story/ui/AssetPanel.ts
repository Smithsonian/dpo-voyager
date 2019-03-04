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

import System from "@ff/graph/System";

import CDocumentManager from "@ff/graph/components/CDocumentManager";
import CAssetManager from "@ff/scene/components/CAssetManager";
import AssetTree from "@ff/scene/ui/AssetTree";

import SystemElement, { customElement, html } from "../../core/ui/SystemElement";

////////////////////////////////////////////////////////////////////////////////

@customElement("sv-asset-panel")
export default class AssetPanel extends SystemElement
{
    constructor(system?: System)
    {
        super(system);
    }

    protected get documentManager() {
        return this.system.getMainComponent(CDocumentManager);
    }
    protected get assetManager() {
        const document = this.documentManager.activeDocument;
        return document ? document.getInnerComponent(CAssetManager) : null;
    }

    protected firstConnected()
    {
        this.classList.add("sv-panel", "sv-asset-panel");
    }

    protected render()
    {
        return html`<div class="sv-panel-section">
            <div class="sv-panel-header">
                <ff-button icon="folder" title="Create Folder" @click=${this.onClickFolder}></ff-button>
                <ff-button icon="pen" title="Rename Item" @click=${this.onClickRename}></ff-button>
                <ff-button icon="trash" title="Delete Item" @click=${this.onClickDelete}></ff-button>
            </div>
        </div>`;
    }

    protected onClickFolder()
    {
        this.assetManager.test();
    }

    protected onClickRename()
    {

    }

    protected onClickDelete()
    {

    }
}