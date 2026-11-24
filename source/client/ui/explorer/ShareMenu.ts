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
import "@ff/ui/TextEdit";
import TextEdit from "@ff/ui/TextEdit";
import CVLanguageManager from "client/components/CVLanguageManager";
import { openModal } from "../Modal";

////////////////////////////////////////////////////////////////////////////////

export function showShareMenu(parent: HTMLElement, language: CVLanguageManager): Promise<void>
{
    const pageUrl = window.location.href;
    const url = encodeURIComponent(pageUrl);
    const title = encodeURI("Check out this interactive 3D model with Smithsonian Voyager:");
    const windowName = language.getLocalizedString("Share Experience");

    const twitterShareUrl = `http://twitter.com/share?text=${title}&url=${url}`;
    const facebookShareUrl = `https://www.facebook.com/sharer/sharer.php?u=${url}`;
    const linkedInShareUrl = `https://www.linkedin.com/shareArticle?url=${url}&mini=true&title=${title}`;
    const iFrameEmbedCode = `<iframe name="Smithsonian Voyager" src="${pageUrl}" width="800" height="450" allow="xr; xr-spatial-tracking; fullscreen"></iframe>`;

    const emailUrl = `mailto:?subject=${title}&body=${url}`;

    const onClickCopy = (event: MouseEvent) => {
        const row = (event.currentTarget as HTMLElement).parentElement;
        const textArea = row.querySelector("ff-text-edit") as TextEdit;
        textArea.select();
        document.execCommand("copy");
    };

    const embedCode = window.top !== window.self ? html`<div class="ff-title" id="embedTitle">${language.getLocalizedString("Embed Link")}</div>
        <div class="ff-flex-row sv-embed-link">
            <ff-text-edit readonly aria-labelledby="embedTitle" text=${iFrameEmbedCode}></ff-text-edit>
            <ff-button icon="copy" title=${language.getLocalizedString("Copy link to Clipboard")} @click=${onClickCopy}></ff-button>
        </div>` : null;

    return openModal(parent, ({ close }) => html`
        <div class="ff-flex-row">
            <div id="shareTitle" class="ff-flex-spacer ff-title">${windowName}</div>
            <ff-button icon="close" transparent class="ff-close-button" title=${language.getLocalizedString("Close")} @click=${() => close()}></ff-button>
        </div>
        <div class="ff-flex-row sv-share-buttons">
            <a href=${twitterShareUrl} tabindex="-1" target="_blank" rel="noopener noreferrer"><ff-button class="sv-share-button-twitter" icon="twitter" title="Twitter" autofocus></ff-button></a>
            <a href=${facebookShareUrl} tabindex="-1" target="_blank" rel="noopener noreferrer"><ff-button class="sv-share-button-facebook" icon="facebook" title="Facebook"></ff-button></a>
            <a href=${linkedInShareUrl} tabindex="-1" target="_blank" rel="noopener noreferrer"><ff-button class="sv-share-button-linkedin" icon="linkedin" title="LinkedIn"></ff-button></a>
            <a href=${emailUrl} tabindex="-1" target="_blank"><ff-button class="sv-share-button-email" icon="email" title=${language.getLocalizedString("Email")}></ff-button></a>
        </div>
        ${embedCode}`,
        { label: windowName, panelClass: "sv-share-menu" });
}
