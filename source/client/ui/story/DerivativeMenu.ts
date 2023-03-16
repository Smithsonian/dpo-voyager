/**
 * 3D Foundation Project
 * Copyright 2021 Smithsonian Institution
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

import Popup, { customElement, html } from "@ff/ui/Popup";

import "@ff/ui/Button";
import "@ff/ui/TextEdit";
import CVLanguageManager from "client/components/CVLanguageManager";
import { EDerivativeQuality, EDerivativeUsage, TDerivativeQuality, TDerivativeUsage } from "client/schema/model";
import CVAssetManager from "client/components/CVAssetManager";
import CVMediaManager from "client/components/CVMediaManager";
import System from "@ff/graph/System";
import { IAssetEntry } from "@ff/scene/components/CAssetManager";

////////////////////////////////////////////////////////////////////////////////

@customElement("sv-derivative-menu")
export default class DerivativeMenu extends Popup
{
    protected url: string;
    protected system :System = null;
    protected files: string[] = [];
    protected errorString: string = "";
    protected qualitySelection: EDerivativeQuality = null;
    protected usageSelection: EDerivativeUsage = EDerivativeUsage["Web3D"];

    static show(parent: HTMLElement, system :System): Promise<[EDerivativeUsage, EDerivativeQuality, IAssetEntry]>
    {
        const menu = new DerivativeMenu(system);
        parent.appendChild(menu);

        return new Promise((resolve, reject) => {
            menu.on("confirm", () => resolve([menu.usageSelection, menu.qualitySelection, menu.mediaManager.selectedAssets[0]]));
            menu.on("close", () => reject());
        });
    }

    get mediaManager(){
        return this.system.getMainComponent(CVMediaManager);
    }

    constructor( system :System)
    {
        super();

        this.system = system;
        this.position = "center";
        this.modal = true;

        this.url = window.location.href;
    }

    close()
    {
        this.dispatchEvent(new CustomEvent("close"));
        this.remove();
    }

    confirm()
    {
        if(this.usageSelection === null) {
            this.errorString = "Please select derivative usage.";
            this.requestUpdate();
        } else if(this.qualitySelection === null) {
            this.errorString = "Please select derivative quality.";
            this.requestUpdate();
        } else if(!/\.(glb|gltf|usdz)/i.test(this.mediaManager.selectedAssets[0]?.info.name)){
            this.errorString = "Please select a model file";
            this.requestUpdate();
        } else {
            this.dispatchEvent(new CustomEvent("confirm"));
            this.remove();
        }
    }

    protected firstConnected()
    {
        super.firstConnected();
        this.classList.add("sv-option-menu", "sv-import-menu");
    }

    protected renderQualityEntry(quality: EDerivativeQuality, index: number)
    {
        return html`<div class="sv-entry" @click=${e => this.onClickQuality(e, index)} ?selected=${ quality === this.qualitySelection }>
            ${EDerivativeQuality[quality] as TDerivativeQuality}
        </div>`;
    }

    protected renderUsageEntry(usage: EDerivativeUsage, index: number)
    {
        return html`<div class="sv-entry" @click=${e => this.onClickUsage(e, index)} ?selected=${ usage === this.usageSelection }>
            ${EDerivativeUsage[usage] as TDerivativeUsage}
        </div>`;
    }

    private hasModel = (node :IAssetEntry)=>{
        return /\.(gltf|glb|usdz)$/.test(node.info.name)
            || node.children.some(this.hasModel);
    }

    protected render()
    {
        const language = this.system.getComponent(CVLanguageManager);
        return html`
        <div>
            <div class="ff-flex-column ff-fullsize">
                <div class="ff-flex-row">
                    <div class="ff-flex-spacer ff-title">${"Add Derivative"} :</div>
                    <ff-button icon="close" transparent class="ff-close-button" title=${language.getLocalizedString("Close")} @click=${this.close}></ff-button>
                </div>
                <div class="ff-flex-row">
                    <div class="ff-flex-spacer ff-header">${language.getLocalizedString("Select Derivative Usage")}:</div>
                </div>
                ${this.usageSelection===null? html`<div class="ff-splitter-section">
                    <div class="ff-scroll-y">
                        ${Object.keys(EDerivativeUsage).filter(key => typeof EDerivativeUsage[key] === 'number').map((key, index) => this.renderUsageEntry(EDerivativeUsage[key], index))}
                    </div>
                </div>` : html`<div class="ff-flex-row">
                    <ff-button selected style="flex:1 1 auto;" text="${ EDerivativeUsage[this.usageSelection] }" @click=${()=> {this.usageSelection = null; this.requestUpdate()}}></ff-button>
                </div>`}
                <div class="ff-flex-row">
                    <div class="ff-flex-spacer ff-header">${language.getLocalizedString("Select Derivative Quality")}:</div>
                </div>
                ${this.qualitySelection === null? html`<div class="ff-splitter-section">
                    <div class="ff-scroll-y">
                        ${Object.keys(EDerivativeQuality).filter(key => typeof EDerivativeQuality[key] === 'number').map((key, index) => this.renderQualityEntry(EDerivativeQuality[key], index))}
                    </div>
                </div>`: html`<div class="ff-flex-row">
                    <ff-button selected style="flex:1 1 auto;" text="${ EDerivativeQuality[this.qualitySelection] }" @click=${()=> {this.qualitySelection = null; this.requestUpdate()}}></ff-button>
                </div>`}
                <div class="ff-flex-row">
                    <div class="ff-flex-spacer ff-header">${language.getLocalizedString("Select Model")}:</div>
                </div>
                <div class="ff-splitter-section">
                    <div class="ff-scroll-y">
                        <ff-asset-tree class="ff-flex-item-stretch" .filter=${this.hasModel} .system=${this.system} path=""></ff-asset-tree>
                    </div>
                </div>
                <div class="ff-flex-row sv-centered">
                    <ff-button icon="upload" class="ff-button ff-control" text=${language.getLocalizedString("Set Derivative")} title=${language.getLocalizedString("Import Model")} @click=${this.confirm}></ff-button>
                </div>
                <div class="ff-flex-row sv-centered sv-import-error-msg">
                    <div>${this.errorString}</div>
                </div>
            </div>
        </div>
        `;
    }

    protected onClickQuality(e: MouseEvent, index: number)
    {
        e.stopPropagation();

        this.qualitySelection = EDerivativeQuality[EDerivativeQuality[index]];
        this.requestUpdate();
    }

    protected onClickUsage(e: MouseEvent, index: number)
    {
        e.stopPropagation();

        this.usageSelection = EDerivativeUsage[EDerivativeUsage[index]];
        this.requestUpdate();
    }
}
