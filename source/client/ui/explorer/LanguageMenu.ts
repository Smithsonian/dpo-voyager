/**
 * 3D Foundation Project
 * Copyright 2020 Smithsonian Institution
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

////////////////////////////////////////////////////////////////////////////////

@customElement("sv-language-menu")
export default class LanguageMenu extends Popup
{
    protected url: string;
    protected language: CVLanguageManager = null;

    static show(parent: HTMLElement, language: CVLanguageManager): Promise<void>
    {
        const menu = new LanguageMenu(language);
        parent.appendChild(menu);

        return new Promise((resolve, reject) => {
            menu.on("close", () => resolve());
        });
    }

    constructor( language: CVLanguageManager )
    {
        super();

        this.language = language;
        this.position = "center";
        this.modal = true;

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
        this.classList.add("sv-language-menu");
    }

    protected renderEntry(language: ILanguageOption, index: number)
    {
        return html`<div class="sv-entry" @click=${e => this.onClickLanguage(e, index)} ?selected=${language.name === this.language.toString()}>
            ${language.name}
        </div>`;
    }

    protected render()
    {
        const language = this.language;

        return html`
        <div class="ff-flex-row">
            <div class="ff-flex-spacer ff-title">${language.getLocalizedString("Set Language")}</div>
            <ff-button icon="close" transparent class="ff-close-button" title=${language.getLocalizedString("Close")} @click=${this.close}></ff-button>
        </div>
        <div class="ff-flex-row">
            <div class="ff-scroll-y">
                ${language.activeLanguages.map((language, index) => this.renderEntry(language, index))}
            </div>
        </div>
        `;
    }

    protected onClickLanguage(e: MouseEvent, index: number)
    {
        const language = this.language;

        e.stopPropagation();

        language.ins.language.setValue(language.activeLanguages[index].id);  
        this.close();  
    }
}
