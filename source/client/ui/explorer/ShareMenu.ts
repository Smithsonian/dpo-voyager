/**
 * 3D Foundation Project
 * Copyright 2019 Smithsonian Institution
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

////////////////////////////////////////////////////////////////////////////////

@customElement("sv-share-menu")
export default class ShareMenu extends Popup
{
    protected url: string;
    protected language: CVLanguageManager = null;

    static show(parent: HTMLElement, language: CVLanguageManager): Promise<void>
    {
        const menu = new ShareMenu(language);
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
        this.classList.add("sv-share-menu");
    }

    protected render()
    {
        const url = encodeURIComponent(this.url);
        const title = encodeURI("Smithsonian Voyager");
        const language = this.language;

        const twitterShareUrl = `http://twitter.com/share?text=${title}&url=${url}`;
        const facebookShareUrl = `https://www.facebook.com/sharer/sharer.php?u=${url}`;
        const linkedInShareUrl = `https://www.linkedin.com/shareArticle?url=${url}&mini=true&title=${title}`;
        const iFrameEmbedCode = `<iframe name="Smithsonian Voyager" src="${this.url}" width="800" height="450" allow="xr; xr-spatial-tracking; fullscreen"></iframe>`;

        const emailUrl = `mailto:?subject=${title}&body=${url}`;

        return html`
        <div class="ff-flex-row">
            <div class="ff-flex-spacer ff-title">${language.getLocalizedString("Share Experience")}</div>
            <ff-button icon="close" transparent class="ff-close-button" title=${language.getLocalizedString("Close")} @click=${this.close}></ff-button>
        </div>
        <div class="ff-flex-row sv-share-buttons">
            <a href=${twitterShareUrl} target="_blank" rel="noopener noreferrer"><ff-button class="sv-share-button-twitter" icon="twitter" title="Twitter"></ff-button></a>
            <a href=${facebookShareUrl} target="_blank" rel="noopener noreferrer"><ff-button class="sv-share-button-facebook" icon="facebook" title="Facebook"></ff-button></a>
            <a href=${linkedInShareUrl} target="_blank" rel="noopener noreferrer"><ff-button class="sv-share-button-linkedin" icon="linkedin" title="LinkedIn"></ff-button></a>
            <a href=${emailUrl} target="_blank"><ff-button class="sv-share-button-email" icon="email" title=${language.getLocalizedString("Email")}></ff-button></a>
        </div>
        <div class="ff-title">${language.getLocalizedString("Embed Link")}</div>
        <div class="ff-flex-row sv-embed-link">
            <ff-text-edit text=${iFrameEmbedCode}></ff-text-edit>
            <ff-button icon="copy" title=${language.getLocalizedString("Copy to Clipboard")} @click=${this.onClickCopy}></ff-button>
        </div>
        `;
    }

    protected onClickCopy()
    {
        const textArea = this.getElementsByTagName("ff-text-edit").item(0) as TextEdit;
        textArea.select();
        document.execCommand("copy");
    }
}
