/**
 * 3D Foundation Project
 * Copyright 2026 Smithsonian Institution
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
import CVModel2 from "client/components/CVModel2";

////////////////////////////////////////////////////////////////////////////////

@customElement("sv-img-import-menu")
export default class ImageImportMenu extends Popup
{
    protected url: string;
    protected language: CVLanguageManager = null;
    protected filename: string = "";
    protected parentSelection: {name: string, id: string} = null;
    protected modelOptions: {name: string, id: string}[] = [];
    protected type: string = "";
    protected errorString: string = "";

    static show(parent: HTMLElement, language: CVLanguageManager, filename: string): Promise<[string, string]>
    {
        const menu = new ImageImportMenu(language, filename);
        parent.appendChild(menu);

        return new Promise((resolve, reject) => {
            menu.on("confirm", () => resolve([menu.type, menu.parentSelection?.name]));
            menu.on("close", () => reject());
        });
    }

    constructor( language: CVLanguageManager, filename: string )
    {
        super();

        this.language = language;
        this.filename = filename;
        this.modelOptions = this.modelOptions.concat(language.getGraphComponents(CVModel2).map(model => ({name: model.node.name, id: model.id})));
        this.position = "center";
        this.modal = true;
        this.parentSelection = this.modelOptions.length > 0 ? this.modelOptions[0] : {name: "Model"+this.modelOptions.length.toString(), id: "-1"};

        this.url = window.location.href;
    }

    close()
    {
        this.dispatchEvent(new CustomEvent("close"));
        this.remove();
    }

    confirm()
    {
        if(this.type === "overlay" && this.parentSelection === null) {
            this.errorString = this.language.getUILocalizedString("Please select model to overlay.");
            this.requestUpdate();
        }
        else {
            this.dispatchEvent(new CustomEvent("confirm"));
            this.remove();
        }
    }

    protected firstConnected()
    {
        super.firstConnected();
        this.classList.add("sv-option-menu", "sv-import-menu");
    }

    protected renderParentEntry(option: string, index: number)
    {
        return html`<div class="sv-entry" @click=${e => this.onClickParent(e, index)} ?selected=${ option === this.parentSelection.name }>
            ${option}
        </div>`;
    }

    protected render()
    {
        const language = this.language;

        const modelSelect = this.type === "overlay" ? html`<div class="ff-flex-row">
                <div class="ff-flex-spacer ff-header">${language.getUILocalizedString("Select Model:")}</div>
            </div>
            ${this.modelOptions.length > 0 ? html`
                ${this.modelOptions.map((option, index) => this.renderParentEntry(option.name, index))}` 
            : html`<div class="ff-flex-row sv-centered sv-notification" style="height:100%; align-items:center">${language.getUILocalizedString("No Models In Scene")}</div>`}` : null;

        return html`
        <div>
            <div class="ff-flex-column ff-fullsize">
                <div class="ff-flex-row">
                    <div class="ff-flex-spacer ff-title">${language.getUILocalizedString("File:")} <i>${this.filename}</i></div>
                    <ff-button icon="close" transparent class="ff-close-button" title=${language.getUILocalizedString("Close")} @click=${this.close}></ff-button>
                </div>
                <div class="ff-flex-row">
                    <div class="ff-flex-spacer ff-header">${language.getUILocalizedString("Select Import Type:")}</div>
                </div>
                <div class="ff-flex-row ff-splitter-section">
                    <div class="ff-scroll-y" role="listbox">
                        <div class="sv-entry" @click=${e => this.onType(e, "environment")} ?selected=${ this.type === "environment" }>Environment Map</div>
                        <div class="sv-entry" @click=${e => this.onType(e, "overlay")} ?selected=${ this.type === "overlay" }>Overlay Map</div>
                        <div class="sv-entry" @click=${e => this.onType(e, "plane")} ?selected=${ this.type === "plane" }>Image Plane</div>
                        ${modelSelect}
                    </div>
                </div>
                <div class="ff-flex-row sv-centered">
                    <ff-button icon="upload" class="ff-button ff-control" text=${language.getUILocalizedString("Import Image")} title=${language.getUILocalizedString("Import Model")} @click=${this.confirm}></ff-button>
                </div>
                <div class="ff-flex-row sv-centered sv-import-error-msg">
                    <div>${this.errorString}</div>
                </div>
            </div>
        </div>
        `;
    }

    protected onType(e: MouseEvent, type: string)
    {
        e.stopPropagation();

        this.type = type;
        this.requestUpdate();
    }

    protected onClickParent(e: MouseEvent, index: number)
    {
        e.stopPropagation();

        this.parentSelection = this.modelOptions[index] || {name: (this.querySelector("#modelName") as HTMLInputElement).value, id: "-1"};
        this.requestUpdate();
    }

    protected onNameChange() {
        this.parentSelection.name = (this.querySelector("#modelName") as HTMLInputElement).value;
    }
}
