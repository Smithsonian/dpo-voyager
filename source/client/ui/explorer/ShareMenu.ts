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
import TextEdit from "@ff/ui/TextEdit";
import CVLanguageManager from "client/components/CVLanguageManager";
import {getFocusableElements, focusTrap} from "../../utils/focusHelpers";

////////////////////////////////////////////////////////////////////////////////

@customElement("sv-share-menu")
export default class ShareMenu extends Popup
{
    protected url: string;
    protected language: CVLanguageManager = null;
    protected needsFocus: boolean = false;

    static show(parent: HTMLElement, language: CVLanguageManager): Promise<void>
    {
        const menu = new ShareMenu(parent, language);
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
        this.classList.add("sv-share-menu");
        this.needsFocus = true;
    }

    protected render()
    {
        const url = encodeURIComponent(this.url);
        const title = encodeURI("Check out this interactive 3D model with Smithsonian Voyager:");
        const language = this.language;

        const twitterShareUrl = `http://twitter.com/share?text=${title}&url=${url}`;
        const facebookShareUrl = `https://www.facebook.com/sharer/sharer.php?u=${url}`;
        const linkedInShareUrl = `https://www.linkedin.com/shareArticle?url=${url}&mini=true&title=${title}`;
        const iFrameEmbedCode = `<iframe name="Smithsonian Voyager" src="${this.url}" width="800" height="450" allow="xr; xr-spatial-tracking; fullscreen"></iframe>`;

        const emailUrl = `mailto:?subject=${title}&body=${url}`;

        const windowName = language.getLocalizedString("Share Experience");

        return html`
        <div role="region" aria-label=${windowName} @keydown=${e =>this.onKeyDown(e)}>
            <div class="ff-flex-row">
                <div id="shareTitle" class="ff-flex-spacer ff-title">${windowName}</div>
                <ff-button icon="close" transparent class="ff-close-button" title=${language.getLocalizedString("Close")} @click=${this.close}></ff-button>
            </div>
            <div class="ff-flex-row sv-share-buttons">
                <a href=${twitterShareUrl} tabindex="-1" target="_blank" rel="noopener noreferrer"><ff-button class="sv-share-button-twitter" icon="twitter" title="Twitter"></ff-button></a>
                <a href=${facebookShareUrl} tabindex="-1" target="_blank" rel="noopener noreferrer"><ff-button class="sv-share-button-facebook" icon="facebook" title="Facebook"></ff-button></a>
                <a href=${linkedInShareUrl} tabindex="-1" target="_blank" rel="noopener noreferrer"><ff-button class="sv-share-button-linkedin" icon="linkedin" title="LinkedIn"></ff-button></a>
                <a href=${emailUrl} tabindex="-1" target="_blank"><ff-button class="sv-share-button-email" icon="email" title=${language.getLocalizedString("Email")}></ff-button></a>
            </div>
            <div class="ff-title" id="embedTitle">${language.getLocalizedString("Embed Link")}</div>
            <div class="ff-flex-row sv-embed-link">
                <ff-text-edit readonly aria-labelledby="embedTitle" text=${iFrameEmbedCode}></ff-text-edit>
                <ff-button icon="copy" title=${language.getLocalizedString("Copy link to Clipboard")} @click=${this.onClickCopy}></ff-button>
            </div>
        </div>
        `;
    }

    protected update(changedProperties) {
        super.update(changedProperties);

        if(this.needsFocus) {
            const container = this.getElementsByClassName("sv-share-button-twitter").item(0) as HTMLElement;
            container.focus();
            this.needsFocus = false;
        }
    }

    protected onClickCopy()
    {
        const textArea = this.getElementsByTagName("ff-text-edit").item(0) as TextEdit;
        textArea.select();
        document.execCommand("copy");
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
