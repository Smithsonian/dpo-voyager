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
import { ILanguageOption } from "client/schema/setup";
import { openModal } from "../Modal";

////////////////////////////////////////////////////////////////////////////////

/** Lets the user pick the scene's active language among the available ones. */
export function showLanguageMenu(parent: HTMLElement, language: CVLanguageManager): Promise<void>
{
    const windowName = language.getLocalizedString("Set Language");

    return openModal(parent, ({ close }) => {

        const select = (index: number) => {
            language.ins.activeLanguage.setValue(language.sceneLanguages[index].id);
            close();
        };

        const onKeyDownEntry = (event: KeyboardEvent, index: number) => {
            const entry = event.currentTarget as HTMLElement;

            if (event.code === "Space" || event.code === "Enter") {
                event.preventDefault();
                event.stopPropagation();
                select(index);
            }
            else if (event.code === "ArrowUp" || event.code === "ArrowDown") {
                const next = (event.code === "ArrowUp" ? entry.previousElementSibling : entry.nextElementSibling) as HTMLElement;
                if (next) {
                    entry.setAttribute("tabIndex", "-1");
                    next.setAttribute("tabIndex", "0");
                    next.focus();
                }
            }
            else if (event.code === "Tab") {
                // leaving the list: make the selected entry the list's tab stop again
                entry.addEventListener("blur", () => {
                    const selected = entry.parentElement.querySelector("[selected]");
                    if (selected && selected !== entry) {
                        entry.setAttribute("tabIndex", "-1");
                        selected.setAttribute("tabIndex", "0");
                    }
                }, { once: true });
            }
        };

        const renderEntry = (option: ILanguageOption, index: number) => {
            const isSelected = option.name === language.nameString();
            return html`<div class="sv-entry" role="option" tabindex=${isSelected ? "0" : "-1"} ?autofocus=${isSelected} ?selected=${isSelected}
                @click=${(event: MouseEvent) => { event.stopPropagation(); select(index); }}
                @keydown=${(event: KeyboardEvent) => onKeyDownEntry(event, index)}>
                ${option.name}
            </div>`;
        };

        return html`
            <div class="ff-flex-row">
                <div class="ff-flex-spacer ff-title">${windowName}</div>
                <ff-button icon="close" transparent class="ff-close-button" title=${language.getLocalizedString("Close")} @click=${() => close()}></ff-button>
            </div>
            <div class="ff-flex-row">
                <div class="ff-scroll-y sv-scroll-offset" role="listbox">
                    ${language.sceneLanguages.map(renderEntry)}
                </div>
            </div>`;
    }, { label: windowName, panelClass: "sv-language-menu sv-option-menu" });
}
