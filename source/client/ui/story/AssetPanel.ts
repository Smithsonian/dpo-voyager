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

import Icon from "@ff/ui/Icon";
import MessageBox from "@ff/ui/MessageBox";

import CAssetManager from "@ff/scene/components/CAssetManager";
import "@ff/scene/ui/AssetTree";

import CVTaskProvider, { ETaskMode } from "../../components/CVTaskProvider";

import DocumentView, { customElement, html } from "../explorer/DocumentView";

////////////////////////////////////////////////////////////////////////////////

@customElement("sv-asset-panel")
export default class AssetPanel extends DocumentView
{
    protected basePath = "";

    protected get assetManager() {
        return this.system.getMainComponent(CAssetManager);
    }
    protected get taskProvider() {
        return this.system.getMainComponent(CVTaskProvider);
    }

    protected firstConnected()
    {
        this.classList.add("sv-panel", "sv-asset-panel");
    }

    protected render()
    {
        const mode = this.taskProvider.ins.mode.value;
        this.basePath = mode === ETaskMode.Expert ? "" : "articles";

        return html`<div class="sv-panel-section">
            <div class="sv-panel-header">
                <ff-button icon="folder" title="Create Folder" @click=${this.onClickFolder}></ff-button>
                <ff-button icon="pen" title="Rename Item" @click=${this.onClickRename}></ff-button>
                <ff-button icon="trash" title="Delete Item" @click=${this.onClickDelete}></ff-button>
                <ff-button icon="redo" title="Refresh View" @click=${this.onClickRefresh}></ff-button>
            </div>
            <div class="ff-flex-item-stretch"><div class="ff-scroll-y">
                <ff-asset-tree draggable .system=${this.system} path=${this.basePath}></ff-asset-tree>
            </div></div>
        </div>`;
    }

    protected onClickFolder()
    {
        const assets = this.assetManager.selectedAssets;
        if (assets.length === 1 && assets[0].info.folder) {
            MessageBox.show("Create Folder", "Folder name:", "prompt", "ok-cancel", "New Folder").then(result => {
                if (result.ok && result.text) {
                    this.assetManager.createFolder(assets[0], result.text);
                }
            });
        }
    }

    protected onClickRename()
    {
        const assets = this.assetManager.selectedAssets;
        if (assets.length === 1) {
            const asset = assets[0];
            MessageBox.show("Rename Asset", "New name:", "prompt", "ok-cancel", asset.info.name).then(result => {
                if (result.ok && result.text) {
                    this.assetManager.rename(asset, result.text);
                }
            });
        }
    }

    protected onClickDelete()
    {
        MessageBox.show("Delete Assets", "Are you sure?", "warning", "ok-cancel").then(result => {
            if (result.ok) {
                this.assetManager.deleteSelected();
            }
        });
    }

    protected onClickRefresh()
    {
        this.assetManager.refresh();
    }
}