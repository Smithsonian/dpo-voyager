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
import { unsafeHTML } from "lit-html/directives/unsafe-html";

import "@ff/ui/Button";
import CVLanguageManager from "client/components/CVLanguageManager";
import { openModal } from "../Modal";

////////////////////////////////////////////////////////////////////////////////

/** Shows the scene's introduction, `content` being an HTML string. */
export function showSplashScreen(parent: HTMLElement, language: CVLanguageManager, content: string): Promise<void>
{
    const windowName = language.getLocalizedString("Welcome to Voyager");

    return openModal(parent, ({ close }) => html`
        <div id="main" tabindex="-1" autofocus>
            <div class="ff-flex-row">
                <div class="ff-flex-spacer ff-title"><b>${windowName}</b></div>
                <ff-button icon="close" transparent class="ff-close-button" title=${language.getLocalizedString("Close")} @click=${() => close()}></ff-button>
            </div>
            <div>${unsafeHTML(content)}</div>
        </div>`,
        { label: windowName, panelClass: "sv-splash" });
}
