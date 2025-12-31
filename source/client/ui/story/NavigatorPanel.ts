/**
 * 3D Foundation Project
 * Copyright 2025 Smithsonian Institution
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

import SystemView, { customElement, html } from "@ff/scene/ui/SystemView";

import "./DocumentList";
import "./NodeTree";

import CVTaskProvider from "../../components/CVTaskProvider";

////////////////////////////////////////////////////////////////////////////////

@customElement("sv-navigator-panel")
export default class NavigatorPanel extends SystemView
{
    private selectedLightCount: number = 0;
    private nodeTree: any = null;
    private availableLightTags: string[] = [];
    private selectedLightTag: string = "";

    protected get taskProvider() {
        return this.system.getMainComponent(CVTaskProvider);
    }

    protected firstConnected()
    {
        this.classList.add("sv-panel", "sv-navigator-panel");
    }

    protected connected()
    {
        this.taskProvider.ins.mode.on("value", this.performUpdate, this);
        this.addEventListener('light-selection-changed', this.onLightSelectionChanged as EventListener);
        this.addEventListener('light-tags-changed', this.onLightTagsChanged as EventListener);
        this.updateAvailableLightTags();
    }

    protected disconnected()
    {
        this.taskProvider.ins.mode.off("value", this.performUpdate, this);
        this.removeEventListener('light-selection-changed', this.onLightSelectionChanged as EventListener);
        this.removeEventListener('light-tags-changed', this.onLightTagsChanged as EventListener);
    }

    protected render()
    {
        const system = this.system;
        const expertMode = this.taskProvider.expertMode;

        const documentList = expertMode ? html`<div class="ff-splitter-section ff-flex-column" style="flex-basis: 30%">
            <div class="sv-panel-header">
                <ff-icon name="document"></ff-icon>
                <div class="ff-text">Documents</div>
            </div>
            <div class="ff-flex-item-stretch"><div class="ff-scroll-y">
                <sv-document-list .system=${system}></sv-document-list>
            </div></div>
            </div>
            <ff-splitter direction="vertical"></ff-splitter>` : null;

        const tagOptions = html`<select class="sv-tag-select" .value=${this.selectedLightTag} @change=${this.onLightTagSelected}>
            <option value="">Select tag to filter...</option>
            ${this.availableLightTags.map(tag => html`<option value=${tag}>${tag}</option>`)}
        </select>`;

        const lightControls = html`
            <div class="sv-light-controls">
                ${tagOptions}
                <div class="sv-light-count">${this.selectedLightCount} light${this.selectedLightCount > 1 ? 's' : ''} selected</div>
                ${this.selectedLightCount > 0 ? html`
                    <ff-button text="Enable" @click=${this.onEnableSelectedLights}></ff-button>
                    <ff-button text="Disable" @click=${this.onDisableSelectedLights}></ff-button>
                    <ff-button text="Clear" @click=${this.onClearSelection}></ff-button>
                ` : null}
            </div>`;

        return html`${documentList}
            <div class="ff-splitter-section ff-flex-column" style="flex-basis: 70%">
                <div class="sv-panel-header">
                    <ff-icon name="hierarchy"></ff-icon>
                    <div class="ff-text">Nodes</div>
                </div>
                ${lightControls}
                <sv-node-tree class="ff-flex-item-stretch" .system=${system}></sv-node-tree>
            </div>`;
    }

    protected onLightSelectionChanged(event: CustomEvent) {
        this.selectedLightCount = event.detail.selectedCount;
        this.updateAvailableLightTags();
        this.requestUpdate();
    }

    protected async onLightTagSelected(event: Event) {
        const select = event.target as HTMLSelectElement;
        this.selectedLightTag = select.value;
        await this.updateComplete;
        const nodeTree = this.querySelector('sv-node-tree') as any;
        if (nodeTree) {
            nodeTree.selectLightsByTag(this.selectedLightTag);
            this.selectedLightCount = this.selectedLightTag ? nodeTree.getSelectedLightNodes().length : 0;
            this.requestUpdate();
        }
    }

    protected updateAvailableLightTags() {
        const nodeTree = this.querySelector('sv-node-tree') as any;
        if (nodeTree) {
            this.availableLightTags = nodeTree.getAllLightTags();
        }
    }

    protected onLightTagsChanged() {
        this.updateAvailableLightTags();
        this.selectedLightTag = "";
        this.requestUpdate();
    }

    protected async onEnableSelectedLights() {
        await this.updateComplete;
        const nodeTree = this.querySelector('sv-node-tree') as any;
        if (nodeTree) {
            nodeTree.enableSelectedLights(true);
        }
    }

    protected async onDisableSelectedLights() {
        await this.updateComplete;
        const nodeTree = this.querySelector('sv-node-tree') as any;
        if (nodeTree) {
            nodeTree.enableSelectedLights(false);
        }
    }

    protected async onClearSelection() {
        await this.updateComplete;
        const nodeTree = this.querySelector('sv-node-tree') as any;
        if (nodeTree) {
            nodeTree.clearSelectedLights();
            this.selectedLightCount = 0;
            this.requestUpdate();
        }
    }
}