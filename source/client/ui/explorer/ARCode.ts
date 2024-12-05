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
import {getFocusableElements, focusTrap} from "../../utils/focusHelpers";

////////////////////////////////////////////////////////////////////////////////

@customElement("sv-ar-code")
export default class ARCode extends Popup
{
    protected url: string;
    protected language: CVLanguageManager = null;
    protected imageUri: string = null;
    protected needsFocus: boolean = false;

    static show(parent: HTMLElement, language: CVLanguageManager, imageUri: string): Promise<void>
    {
        const menu = new ARCode(parent, language, imageUri);
        parent.appendChild(menu);

        return new Promise((resolve, reject) => {
            menu.on("close", () => resolve());
        });
    }

    constructor( parent: HTMLElement, language: CVLanguageManager, imageUri: string )
    {
        super();

        this.language = language;
        this.imageUri = imageUri;
        this.position = "center";
        this.portal = parent;
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
        this.classList.add("sv-ar-code");
        this.needsFocus = true;
    }

    protected render()
    {
        const language = this.language;

        const windowName = language.getLocalizedString("AR Experience"); 

        return html`
        <div role="region" aria-label=${windowName} @keydown=${e =>this.onKeyDown(e)}>
            <div class="ff-flex-row">
                <div id="arCodeTitle" class="ff-flex-spacer ff-title">${windowName}</div>
                <ff-button icon="close" transparent class="ff-close-button" title=${language.getLocalizedString("Close")} @click=${this.close}></ff-button>
            </div>
            <div class="ff-title" id="embedTitle">${language.getLocalizedString("1. Scan the code with your mobile device to return here.")}</div>
            <div class="ff-flex-row">
                <img src=${this.imageUri}></img>
            </div>
            <div class="ff-title">${language.getLocalizedString("2. Tap ")}<ff-icon name="ar"></ff-icon>${language.getLocalizedString(" to launch an AR experience! ")}</div>
        </div>
        `;
    }

    protected update(changedProperties) {
        super.update(changedProperties);

        if(this.needsFocus) {
            const container = this.getElementsByClassName("ff-close-button").item(0) as HTMLElement;
            container.focus();
            this.needsFocus = false;
        }
    }

    protected onKeyDown(e: KeyboardEvent)
    {
        if (e.code === "Escape") {
            e.preventDefault();
            this.close();
        }
        else if(e.code === "Tab") {
            focusTrap(getFocusableElements(this) as HTMLElement[], e);
        }
    }
}
