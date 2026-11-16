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

import { html } from "@ff/ui/CustomElement";

import "@ff/ui/Button";
import CVLanguageManager from "client/components/CVLanguageManager";
import CVModel2 from "client/components/CVModel2";
import { openModal } from "../Modal";

////////////////////////////////////////////////////////////////////////////////

interface IModelOption
{
    name: string;
    id: string;
}

/**
 * Asks what an imported image is for: environment map, overlay map (and of which
 * model), image plane or miscellaneous asset.
 * Resolves with the type and model name, or `undefined` if cancelled.
 */
export function showImageImportMenu(parent: HTMLElement, language: CVLanguageManager, filename: string): Promise<[string, string] | undefined>
{
    const modelOptions: IModelOption[] = language.getGraphComponents(CVModel2)
        .map(model => ({ name: model.node.name, id: model.id }));

    let parentSelection: IModelOption = modelOptions.length > 0 ? modelOptions[0] : { name: "Model" + modelOptions.length.toString(), id: "-1" };
    let type = "";
    let errorString = "";

    return openModal<[string, string]>(parent, ({ close, update }) => {

        const confirm = () => {
            if (type === "overlay" && parentSelection === null) {
                errorString = language.getUILocalizedString("Please select model to overlay.");
                update();
            }
            else {
                close([type, parentSelection?.name]);
            }
        };

        const onType = (e: MouseEvent, value: string) => {
            e.stopPropagation();
            type = value;
            update();
        };

        const onClickParent = (e: MouseEvent, index: number) => {
            e.stopPropagation();
            parentSelection = modelOptions[index];
            update();
        };

        const renderParentEntry = (option: string, index: number) =>
            html`<div class="sv-entry" @click=${e => onClickParent(e, index)} ?selected=${ option === parentSelection.name }>
                ${option}
            </div>`;

        const modelSelect = type === "overlay" ? html`<div class="ff-flex-row">
                <div class="ff-flex-spacer ff-header">${language.getUILocalizedString("Select Model:")}</div>
            </div>
            ${modelOptions.length > 0 ? html`
                ${modelOptions.map((option, index) => renderParentEntry(option.name, index))}`
            : html`<div class="ff-flex-row sv-centered sv-notification" style="height:100%; align-items:center">${language.getUILocalizedString("No Models In Scene")}</div>`}` : null;

        return html`
            <div class="ff-flex-column ff-fullsize">
                <div class="ff-flex-row">
                    <div class="ff-flex-spacer ff-title">${language.getUILocalizedString("File:")} <i>${filename}</i></div>
                    <ff-button icon="close" transparent class="ff-close-button" title=${language.getUILocalizedString("Close")} @click=${() => close()}></ff-button>
                </div>
                <div class="ff-flex-row">
                    <div class="ff-flex-spacer ff-header">${language.getUILocalizedString("Select Import Type:")}</div>
                </div>
                <div class="ff-flex-row ff-splitter-section">
                    <div class="ff-scroll-y" role="listbox">
                        <div class="sv-entry" @click=${e => onType(e, "environment")} ?selected=${ type === "environment" }>Environment Map</div>
                        <div class="sv-entry" @click=${e => onType(e, "overlay")} ?selected=${ type === "overlay" }>Overlay Map</div>
                        <div class="sv-entry" @click=${e => onType(e, "plane")} ?selected=${ type === "plane" }>Image Plane</div>
                        <div class="sv-entry" @click=${e => onType(e, "misc")} ?selected=${ type === "misc" }>Misc Asset</div>
                        ${modelSelect}
                    </div>
                </div>
                <div class="ff-flex-row sv-centered">
                    <ff-button icon="upload" class="ff-button ff-control" text=${language.getUILocalizedString("Import Image")} title=${language.getUILocalizedString("Import Model")} @click=${confirm}></ff-button>
                </div>
                <div class="ff-flex-row sv-centered sv-import-error-msg">
                    <div>${errorString}</div>
                </div>
            </div>`;
    }, { label: language.getUILocalizedString("Import Image"), panelClass: "sv-option-menu sv-import-menu" });
}
