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
import CVLanguageManager from "client/components/CVLanguageManager";
import {getFocusableElements, focusTrap} from "../../utils/focusHelpers";

////////////////////////////////////////////////////////////////////////////////

@customElement("sv-splash")
export default class SplashScreen extends Popup
{
    protected url: string;
    protected language: CVLanguageManager = null;
    protected content: string = "";
    protected contentElement: HTMLDivElement;

   
    static show(parent: HTMLElement, language: CVLanguageManager, content: string): Promise<void>
    {
        const screen = new SplashScreen(parent, language, content);
        parent.appendChild(screen);

        return new Promise((resolve, reject) => {
            screen.on("close", () => resolve());
        });
    }

    constructor( parent: HTMLElement, language: CVLanguageManager, content: string )
    {
        super();

        this.language = language;
        this.content = content;
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
        this.contentElement = this.createElement("div", null);
        this.classList.add("sv-splash");
    }

    protected render()
    {
        const language = this.language;
        const contentElement = this.contentElement;

        contentElement.innerHTML = this.content;

        return html`
        <div id="main" tabIndex="-1" role="region" aria-label="Introduction to Voyager" @keydown=${e =>this.onKeyDownMain(e)}>
            <div class="ff-flex-row">
                <div class="ff-flex-spacer ff-title"><b>${language.getLocalizedString("Welcome to Voyager")}</b></div>
                <ff-button icon="close" transparent class="ff-close-button" title=${language.getLocalizedString("Close")} @click=${this.close}></ff-button>
            </div>
            <div>
                ${contentElement}
            </div>
        </div>
        `;
    }

    protected firstUpdated(changedProperties) {
        super.firstUpdated(changedProperties);

        (this.querySelector("#main") as HTMLElement).focus();
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
}
