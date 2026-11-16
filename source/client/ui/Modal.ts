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

import CustomElement, { customElement, property, html, PropertyValues, TemplateResult } from "@ff/ui/CustomElement";
import { ifDefined } from "lit-html/directives/if-defined";

////////////////////////////////////////////////////////////////////////////////

export type ModalContent = TemplateResult | Node;

export interface IModalCloseEvent<T = unknown> extends CustomEvent<T>
{
    type: "close";
}

/**
 * Application popup window, built on a native `<dialog>`.
 * When closed, dispatches a "close" event (see {@link IModalCloseEvent}) with the
 * value passed to {@link close} as detail, `undefined` if dismissed. The element
 * doesn't remove itself: its owner does, on "close". This allows using it from a
 * template (`<sv-modal .content=${...} @close=${...}>`) as well as from code,
 * see {@link openIn} and {@link openModal}.
 */
@customElement("sv-modal")
export default class Modal extends CustomElement
{
    /** Content of the panel. */
    @property({ attribute: false })
    content: ModalContent = null;

    /** Accessible name of the dialog. */
    @property({ type: String })
    label = "";

    /** CSS class(es) added to the panel, for per-popup styling. */
    @property({ type: String })
    panelClass = "";

    /** If false, Escape and backdrop clicks don't close the dialog: only its content does. */
    @property({ type: Boolean })
    dismissible = true;

    protected dialog: HTMLDialogElement = null;

    private _value: unknown = undefined;
    private _closed = false;
    // true while a pointer press that started on the backdrop is in progress
    private _backdropPress = false;

    constructor()
    {
        super();
        this.onDialogClose = this.onDialogClose.bind(this);
        this.onDialogKeyDown = this.onDialogKeyDown.bind(this);
        this.onDialogPointerDown = this.onDialogPointerDown.bind(this);
        this.onDialogClick = this.onDialogClick.bind(this);
    }

    /** Closes the dialog, dispatching "close" with `value` as detail. */
    close(value?: unknown)
    {
        this._value = value;

        if (this.dialog && this.dialog.open) {
            // triggers onDialogClose
            this.dialog.close();
        }
        else {
            this.onDialogClose();
        }
    }

    /**
     * Appends the element to `parent`. Resolves with the value passed to {@link close},
     * `undefined` if dismissed, once closed and removed.
     */
    openIn(parent: Node): Promise<unknown>
    {
        return new Promise(resolve => {
            this.addEventListener("close", (event: IModalCloseEvent) => {
                this.remove();
                resolve(event.detail);
            }, { once: true });

            parent.appendChild(this);
        });
    }

    protected firstConnected()
    {
        super.firstConnected();
        this.classList.add("sv-modal");
    }

    protected render()
    {
        // tabindex: clicks on non-focusable content keep focus in the dialog, so that
        // the keydown fallback for browsers without `closedby` keeps working
        return html`<dialog closedby=${this.dismissible ? "closerequest" : "none"} tabindex="-1" aria-label=${ifDefined(this.label || undefined)}
            @close=${this.onDialogClose} @keydown=${this.onDialogKeyDown}
            @pointerdown=${this.onDialogPointerDown} @click=${this.onDialogClick}>
            <div class="sv-modal-panel ${this.panelClass}">${this.content}</div>
        </dialog>`;
    }

    protected firstUpdated(changedProperties: PropertyValues)
    {
        super.firstUpdated(changedProperties);

        this.dialog = this.querySelector(":scope > dialog");

        if (!this._closed) {
            // focuses the content's [autofocus] element, if any
            this.dialog.show();
        }
    }

    protected onDialogClose()
    {
        if (this._closed) {
            return;
        }

        this._closed = true;
        this.dispatchEvent(new CustomEvent("close", { detail: this._value }));
    }

    protected onDialogKeyDown(event: KeyboardEvent)
    {
        // Fallback for browsers not supporting `closedby`, in which non-modal
        // dialogs don't handle close requests
        if (event.key === "Escape" && this.dismissible && !("closedBy" in HTMLDialogElement.prototype)) {
            event.preventDefault();
            this.close();
        }
    }

    protected onDialogPointerDown(event: PointerEvent)
    {
        this._backdropPress = event.target === this.dialog;
    }

    protected onDialogClick(event: MouseEvent)
    {
        // Only dismiss if both press and release happened on the backdrop, so that
        // e.g. selecting text in the panel and releasing outside doesn't close it.
        if (event.target === this.dialog && this._backdropPress && this.dismissible) {
            this.close();
        }
        this._backdropPress = false;
    }
}

////////////////////////////////////////////////////////////////////////////////

export interface IModalOptions
{
    /** Accessible name of the dialog. */
    label: string;
    /** CSS class(es) added to the panel, for per-popup styling. */
    panelClass?: string;
    /** If false, Escape and backdrop clicks don't close the popup. Default: true. */
    dismissible?: boolean;
}

export interface IModalContext<T>
{
    /** Closes the popup, resolving the promise returned by {@link openModal} with `value`. */
    close(value?: T): void;
    /** Renders the content again, after a change of state it depends on. */
    update(): void;
}

/**
 * Shows a popup in `parent`, with the content returned by `render`.
 * @returns the value passed to `close()`, or `undefined` if dismissed.
 */
export function openModal<T = void>(parent: HTMLElement,
    render: (context: IModalContext<T>) => ModalContent, options: IModalOptions): Promise<T | undefined>
{
    const modal = new Modal();
    modal.label = options.label;
    modal.panelClass = options.panelClass || "";
    modal.dismissible = options.dismissible !== false;

    const context: IModalContext<T> = {
        close: (value?: T) => modal.close(value),
        update: () => { modal.content = render(context); },
    };

    context.update();

    return modal.openIn(parent) as Promise<T | undefined>;
}
