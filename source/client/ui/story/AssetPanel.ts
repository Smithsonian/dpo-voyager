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

import MessageBox from "@ff/ui/MessageBox";
import Notification from "@ff/ui/Notification";

import "@ff/scene/ui/AssetTree";

import CVMediaManager from "../../components/CVMediaManager";
import CVTaskProvider, { ETaskMode } from "../../components/CVTaskProvider";

import DocumentView, { customElement, html } from "../explorer/DocumentView";

////////////////////////////////////////////////////////////////////////////////

@customElement("sv-asset-panel")
export default class AssetPanel extends DocumentView
{
    protected basePath = "";

    protected get mediaManager() {
        return this.system.getMainComponent(CVMediaManager);
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

        return html`<div class="sv-panel-header">
                <ff-button icon="folder" title="Create Folder" @click=${this.onClickFolder}></ff-button>
                <ff-button icon="pen" title="Rename Item" @click=${this.onClickRename}></ff-button>
                <ff-button icon="trash" title="Delete Item" @click=${this.onClickDelete}></ff-button>
                <ff-button icon="redo" title="Refresh View" @click=${this.onClickRefresh}></ff-button>
            </div>
            <ff-asset-tree class="ff-flex-item-stretch" draggable .system=${this.system} path=${this.basePath}>
            </ff-asset-tree>`;
    }

    protected onClickFolder()
    {
        const parentAsset = this.mediaManager.selectedAssets[0] || this.mediaManager.root;

        if (parentAsset && parentAsset.info.folder) {
            MessageBox.show("Create Folder", "Folder name:", "prompt", "ok-cancel", "New Folder").then(result => {
                if (result.ok && result.text) {
                    const infoText = `folder '${result.text}' in '${parentAsset.info.path}'`;
                    this.mediaManager.createFolder(parentAsset, result.text)
                        .then(() => Notification.show(`Created ${infoText}`))
                        .catch(error => Notification.show(`Failed to create ${infoText}`, "error"));
                }
            });
        }
    }

    protected onClickRename()
    {
        const assets = this.mediaManager.selectedAssets;
        if (assets.length === 1) {
            const asset = assets[0];
            MessageBox.show("Rename Asset", "New name:", "prompt", "ok-cancel", asset.info.name).then(result => {
                if (result.ok && result.text) {
                    const infoText = `asset '${asset.info.path}' to '${result.text}.'`;
                    this.mediaManager.rename(asset, result.text)
                        .then(() => Notification.show(`Renamed ${infoText}`))
                        .catch(error => Notification.show(`Failed to rename ${infoText}`, "error"));
                }
            });
        }
    }

    protected onClickDelete()
    {
        MessageBox.show("Delete Assets", "Are you sure?", "warning", "ok-cancel").then(result => {
            if (result.ok) {
                this.mediaManager.deleteSelected()
                    .then(() => Notification.show("Deleted selected assets."))
                    .catch(() => Notification.show("Failed to delete selected assets.", "error"));
            }
        });
    }

    protected onClickRefresh()
    {
        this.mediaManager.refresh();
    }
}