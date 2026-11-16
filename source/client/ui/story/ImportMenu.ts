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

import { html } from "@ff/ui/CustomElement";

import "@ff/ui/Button";
import CVLanguageManager from "client/components/CVLanguageManager";
import { EDerivativeQuality, TDerivativeQuality } from "client/schema/model";
import CVModel2 from "client/components/CVModel2";
import CVImagePlane from "client/components/CVImagePlane";
import { openModal } from "../Modal";

////////////////////////////////////////////////////////////////////////////////

interface IModelOption
{
    name: string;
    id: string;
}

/**
 * Asks for the derivative quality of an imported model file, and the model it is
 * for: an existing one, or a new one to create with the given name.
 * Resolves with them, or `undefined` if cancelled.
 */
export function showImportMenu(parent: HTMLElement, language: CVLanguageManager, filename: string): Promise<[EDerivativeQuality, string] | undefined>
{
    const modelOptions: IModelOption[] = language.getGraphComponents(CVModel2)
        .filter(model => !model.is(CVImagePlane))
        .map(model => ({ name: model.node.name, id: model.id }));

    let newModelName = "Model" + modelOptions.length.toString();
    let qualitySelection: EDerivativeQuality = null;
    let parentSelection: IModelOption = modelOptions.length > 0 ? modelOptions[0] : { name: newModelName, id: "-1" };
    let errorString = "";

    return openModal<[EDerivativeQuality, string]>(parent, ({ close, update }) => {

        const confirm = () => {
            if (qualitySelection === null) {
                errorString = language.getUILocalizedString("Please select derivative quality.");
                update();
            }
            else {
                close([qualitySelection, parentSelection.name]);
            }
        };

        const onClickQuality = (e: MouseEvent, index: number) => {
            e.stopPropagation();
            qualitySelection = EDerivativeQuality[EDerivativeQuality[index]];
            update();
        };

        // index -1: new model
        const onClickParent = (e: MouseEvent, index: number) => {
            e.stopPropagation();
            parentSelection = modelOptions[index] || { name: newModelName, id: "-1" };
            update();
        };

        const onNameInput = (e: Event) => {
            newModelName = (e.target as HTMLInputElement).value;
            if (parentSelection.id === "-1") {
                parentSelection.name = newModelName;
            }
        };

        const renderQualityEntry = (quality: EDerivativeQuality, index: number) =>
            html`<div class="sv-entry" @click=${e => onClickQuality(e, index)} ?selected=${ quality === qualitySelection }>
                ${EDerivativeQuality[quality] as TDerivativeQuality}
            </div>`;

        const renderParentEntry = (option: string, index: number) =>
            html`<div class="sv-entry" @click=${e => onClickParent(e, index)} ?selected=${ option === parentSelection.name }>
                ${option}
            </div>`;

        return html`
            <div class="ff-flex-column ff-fullsize">
                <div class="ff-flex-row">
                    <div class="ff-flex-spacer ff-title">${language.getUILocalizedString("File:")} <i>${filename}</i></div>
                    <ff-button icon="close" transparent class="ff-close-button" title=${language.getUILocalizedString("Close")} @click=${() => close()}></ff-button>
                </div>
                <div class="ff-flex-row">
                    <div class="ff-flex-spacer ff-header">${language.getUILocalizedString("Select Derivative Quality:")}</div>
                </div>
                <div class="ff-splitter-section" style="flex-basis: 70%">
                    <div class="ff-scroll-y">
                        ${Object.keys(EDerivativeQuality).filter(key => typeof EDerivativeQuality[key] === 'number').map((key, index) => renderQualityEntry(EDerivativeQuality[key], index))}
                    </div>
                </div>
                <div class="ff-flex-row">
                    <div class="ff-flex-spacer ff-header">${language.getUILocalizedString("Select Model:")}</div>
                </div>
                <div class="ff-splitter-section" style="flex-basis: 30%">
                    ${modelOptions.length > 0 ? html`<div class="ff-scroll-y">
                        ${modelOptions.map((option, index) => renderParentEntry(option.name, index))}
                    </div>` : html`<div class="ff-flex-row sv-centered sv-notification" style="height:100%; align-items:center">${language.getUILocalizedString("No Models In Scene")}</div>`}
                </div>
                <div class="sv-entry" @click=${e => onClickParent(e, -1)} ?selected=${ "-1" === parentSelection.id }>
                    <div class="ff-flex-row">
                        <label class="ff-label ff-off">${language.getUILocalizedString("Add New Model")}:</label>
                        <div class="ff-flex-spacer"></div>
                        <input id="modelName" tabindex="0" class="ff-property-field ff-input" @input=${onNameInput} .value=${newModelName} touch-action="none" style="touch-action: none;" title="Parent.Name [string]">
                    </div>
                </div>
                <div class="ff-flex-row sv-centered">
                    <ff-button icon="upload" class="ff-button ff-control" text=${language.getUILocalizedString("Import Model")} title=${language.getUILocalizedString("Import Model")} @click=${confirm}></ff-button>
                </div>
                <div class="ff-flex-row sv-centered sv-import-error-msg">
                    <div>${errorString}</div>
                </div>
            </div>`;
    }, { label: language.getUILocalizedString("Import Model"), panelClass: "sv-option-menu sv-import-menu" });
}
