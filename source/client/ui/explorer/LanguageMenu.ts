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

import Popup, { customElement, html } from "@ff/ui/Popup";

import "@ff/ui/Button";
import "@ff/ui/TextEdit";
import CVLanguageManager from "client/components/CVLanguageManager";
import { ILanguageOption } from "client/schema/setup";
import {getFocusableElements, focusTrap} from "../../utils/focusHelpers";

////////////////////////////////////////////////////////////////////////////////

@customElement("sv-language-menu")
export default class LanguageMenu extends Popup
{
    protected url: string;
    protected language: CVLanguageManager = null;

    static show(parent: HTMLElement, language: CVLanguageManager): Promise<void>
    {
        const menu = new LanguageMenu(parent, language);
        parent.appendChild(menu);

        return new Promise((resolve, reject) => {
            menu.on("close", () => resolve());
        });
    }

    constructor( parent: HTMLElement, language: CVLanguageManager )
    {
        super();

        this.language = language;
        this.position = "center";
        this.modal = true;
        this.portal = parent;

        this.url = window.location.href;
    }

    close()
    {
        this.dispatchEvent(new CustomEvent("close"));
        this.remove();
    }

    protected firstConnected()
    {
        super.firstConnected();
        this.classList.add("sv-language-menu", "sv-option-menu");
    }

    protected renderEntry(language: ILanguageOption, index: number)
    {
        const isSelected = language.name === this.language.nameString();
        return html`<div class="sv-entry" role="option" tabindex=${isSelected ? "0" : "-1"} @click=${e => this.onClickLanguage(e, index)} @keydown=${e =>this.onKeyDownEntry(e, index)} ?selected=${isSelected}>
            ${language.name}
        </div>`;
    }

    protected render()
    {
        const language = this.language;

        return html`
        <div role="region" aria-label="Language Menu" @keydown=${e =>this.onKeyDownMain(e)}>
            <div class="ff-flex-row">
                <div class="ff-flex-spacer ff-title">${language.getLocalizedString("Set Language")}</div>
                <ff-button icon="close" transparent class="ff-close-button" title=${language.getLocalizedString("Close")} @click=${this.close}></ff-button>
            </div>
            <div class="ff-flex-row">
                <div class="ff-scroll-y sv-scroll-offset" role="listbox">
                    ${language.activeLanguages.map((language, index) => this.renderEntry(language, index))}
                </div>
            </div>
        </div>
        `;
    }

    protected firstUpdated(changedProperties) {
        super.firstUpdated(changedProperties);

        (Array.from(this.getElementsByClassName("sv-entry")).find(elem => elem.getAttribute("tabIndex") === "0") as HTMLElement).focus();
    }

    protected onClickLanguage(e: MouseEvent, index: number)
    {
        const language = this.language;

        e.stopPropagation();

        language.ins.language.setValue(language.activeLanguages[index].id);  
        this.close();  
    }

    protected onKeyDownEntry(e: KeyboardEvent, index: number)
    {
        const language = this.language;
        if (e.code === "Space" || e.code === "Enter") {
            e.preventDefault();
            e.stopPropagation();
            language.ins.language.setValue(language.activeLanguages[index].id);
            this.close();
        }
        else if(e.code === "ArrowUp" || e.code === "ArrowDown") {
            const currentActive = e.target instanceof Element ? e.target as Element : null;
            if(currentActive) {
                const newActive = e.code === "ArrowUp" ? currentActive.previousElementSibling : currentActive.nextElementSibling;
                if(newActive) {
                    currentActive.setAttribute("tabIndex", "-1");
                    newActive.setAttribute("tabIndex", "0");
                    (newActive as HTMLElement).focus();
                }
            }
        }
        else if(e.code === "Tab") {
            this.addEventListener('blur', this.tabReset, { once: true, capture: true });
        }
    }

    protected onKeyDownMain(e: KeyboardEvent)
    {
        if (e.code === "Escape") {
            this.close();
        }
        else if(e.code === "Tab") {
            focusTrap(getFocusableElements(this) as HTMLElement[], e);
        }
    }

    // resets tabIndex if needed
    protected tabReset(e: FocusEvent) {
        const currentActive = e.target instanceof Element ? e.target as Element : null;
        if(currentActive) {
            const currentSelected = Array.from(currentActive.parentElement.children).find(elem => elem.hasAttribute("selected"));
            if(currentSelected !== currentActive) {
                currentActive.setAttribute("tabIndex", "-1");
                currentSelected.setAttribute("tabIndex", "0");
            }
        }
    }
}
