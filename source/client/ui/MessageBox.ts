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
import "@ff/ui/Icon";
import { openModal } from "./Modal";

////////////////////////////////////////////////////////////////////////////////

export type TMessageBoxType = "info" | "warning" | "error" | "prompt";
export type TMessageBoxButtons = "ok" | "ok-cancel" | "cancel" | "yes-no";

export interface IMessageBoxResult
{
    ok: boolean;
    cancel: boolean;
    /** Text entered in a "prompt" message box. */
    text?: string;
}

/**
 * Shows a message, or asks a question, in a popup.
 * A "yes-no" message box can't be dismissed: it needs an answer. Dismissing the
 * others is the same as cancelling.
 */
export function showMessageBox(caption: string, text: string,
    type: TMessageBoxType = "info", buttons: TMessageBoxButtons = "ok",
    defaultValue: string = "", parent: HTMLElement = document.body): Promise<IMessageBoxResult>
{
    let value = defaultValue || "";
    const cancelled: IMessageBoxResult = { ok: false, cancel: true, text: "" };

    return openModal<IMessageBoxResult>(parent, ({ close }) => {

        const ok = () => close({ ok: true, cancel: false, text: value });
        const cancel = () => close(cancelled);

        const buttonElements = [];
        if (buttons === "ok" || buttons === "ok-cancel") {
            buttonElements.push(html`<ff-button text="OK" ?autofocus=${type !== "prompt"} @click=${ok}></ff-button>`);
        }
        if (buttons === "ok-cancel" || buttons === "cancel") {
            buttonElements.push(html`<ff-button text="Cancel" @click=${cancel}></ff-button>`);
        }
        if (buttons === "yes-no") {
            buttonElements.push(html`<ff-button text="Yes" autofocus @click=${ok}></ff-button>`);
            buttonElements.push(html`<ff-button text="No" @click=${cancel}></ff-button>`);
        }

        const input = type === "prompt" ? html`<div class="ff-control ff-line-edit">
                <input type="text" autofocus .value=${value}
                    @focus=${(e: FocusEvent) => (e.target as HTMLInputElement).select()}
                    @input=${(e: Event) => value = (e.target as HTMLInputElement).value}
                    @keydown=${(e: KeyboardEvent) => e.key === "Enter" && ok()}>
            </div>` : null;

        return html`<div class="ff-flex-row ff-title">
                <ff-icon class="ff-type-icon" name=${type}></ff-icon>
                <div class="ff-content">
                    <div class="ff-caption">${caption}</div>
                    <div class="ff-text">${text}</div>
                    ${input}
                </div>
            </div>
            <div class="ff-flex-row ff-buttons"><div class="ff-flex-spacer"></div>${buttonElements}</div>`;

    }, { label: caption, panelClass: "sv-message-box", dismissible: buttons !== "yes-no" })
    .then(result => result || cancelled);
}
