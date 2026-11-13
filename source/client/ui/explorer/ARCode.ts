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
import { openModal } from "../Modal";

////////////////////////////////////////////////////////////////////////////////

export function showARCode(parent: HTMLElement, language: CVLanguageManager, imageUri: string): Promise<void>
{
    const windowName = language.getLocalizedString("AR Experience");

    return openModal(parent, ({ close }) => html`
        <div class="ff-flex-row">
            <div id="arCodeTitle" class="ff-flex-spacer ff-title">${windowName}</div>
            <ff-button icon="close" transparent class="ff-close-button" title=${language.getLocalizedString("Close")} @click=${() => close()} autofocus></ff-button>
        </div>
        <div class="ff-title" id="embedTitle">${language.getLocalizedString("1. Scan the code with your mobile device to return here.")}</div>
        <div class="ff-flex-row">
            <img src=${imageUri}></img>
        </div>
        <div class="ff-title">${language.getLocalizedString("2. Tap ")}<ff-icon name="ar"></ff-icon>${language.getLocalizedString(" to launch an AR experience! ")}</div>`,
        { label: windowName, panelClass: "sv-ar-code" });
}
