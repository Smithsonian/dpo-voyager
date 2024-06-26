/**
 * FF Typescript Foundation Library
 * Copyright 2019 Ralph Wiedemeier, Frame Factory GmbH
 *
 * License: MIT
 */

import Popup, { customElement, property, html } from "./Popup";

import "./LineEdit";
import { ILineEditChangeEvent } from "./LineEdit";

import "./Button";
import "./Icon";

////////////////////////////////////////////////////////////////////////////////

export type TMessageBoxType = "info" | "warning" | "error" | "prompt";
export type TMessageBoxButtons = "ok" | "ok-cancel" | "cancel" | "yes-no";

export interface IMessageBoxCloseEvent extends CustomEvent
{
    target: MessageBox;
    detail: IMessageBoxResult;
}

export interface IMessageBoxResult
{
    ok: boolean;
    cancel: boolean;
    text?: string;
}

@customElement("ff-message-box")
export default class MessageBox extends Popup
{
    static show(caption: string, text: string,
                type?: TMessageBoxType, buttons?: TMessageBoxButtons,
                defaultValue?: string, parent?: HTMLElement): Promise<IMessageBoxResult>
    {
        const box = new MessageBox(caption, text, type, buttons);
        box.defaultValue = defaultValue;
        box.portal = parent;
        (parent || document.body).appendChild(box);

        return new Promise((resolve, reject) => {
            box.on("close", (e: IMessageBoxCloseEvent) => resolve(e.detail));
        });
    }

    @property({ type: String })
    type: TMessageBoxType;

    @property({ type: String })
    caption: string;

    @property({ type: String })
    text: string;

    @property({ type: String })
    icon: string;

    @property({ type: String })
    buttons: TMessageBoxButtons;

    @property({ type: String })
    defaultValue: string;

    @property({ type: Boolean })
    closable: boolean = false;

    value: string = "";

    constructor(caption?: string, text?: string, type?: TMessageBoxType, buttons?: TMessageBoxButtons)
    {
        super();

        this.position = "center";
        this.modal = true;

        this.type = type || "info";
        this.caption = caption || "Message";
        this.text = text || "";
        this.icon = "";
        this.buttons = buttons || "ok";
        this.defaultValue = "";
        this.value = "";
    }


    close(confirmed?: boolean| string)
    {
        this.dispatchCloseEvent(false);
        this.remove();
    }

    protected dispatchCloseEvent(ok: boolean, text: string = "")
    {
        const detail: IMessageBoxResult = {
            ok,
            cancel: !ok,
            text
        };

        this.dispatchEvent(new CustomEvent("close", { detail }));
    }

    protected firstConnected()
    {
        super.firstConnected();
        this.classList.add("ff-message-box");
        setTimeout(() => this.classList.add("ff-transition"));
    }

    protected updated()
    {
        super.updated();

        const defaultElement = this.getElementsByClassName("ff-default").item(0) as HTMLElement;
        defaultElement.focus();
    }

    protected render()
    {
        const icon = this.icon || this.type;
        const buttons = this.buttons || "ok";
        const buttonElements = [];

        if (buttons === "ok" || buttons === "ok-cancel") {
            buttonElements.push(html`<ff-button class="ff-default" text="OK" @click=${this.onOK}></ff-button>`);
        }
        if (buttons === "ok-cancel" || buttons === "cancel") {
            buttonElements.push(html`<ff-button text="Cancel" @click=${this.onCancel}></ff-button>`);
        }
        if (buttons === "yes-no") {
            buttonElements.push(html`<ff-button class="ff-default" text="Yes" @click=${this.onOK}></ff-button>`);
            buttonElements.push(html`<ff-button text="No" @click=${this.onCancel}></ff-button>`);
        }

        const inputElement = this.type === "prompt" ?
            html`<ff-line-edit class="ff-default" text=${this.defaultValue} @change=${this.onInputChange}></ff-line-edit>` :
            null;

        return html`<div class="ff-flex-row ff-title">
                <ff-icon class="ff-type-icon" name=${icon}></ff-icon>
                <div class="ff-content">
                    <div class="ff-caption">${this.caption}</div>
                    <div class="ff-text">${this.text}</div>
                    ${inputElement}
                </div>
                ${this.closable ? html`<ff-button class="ff-close-button" icon="close" transparent @click=${this.onCancel}></ff-button>` : null}
            </div>
            <div class="ff-flex-row ff-buttons"><div class="ff-flex-spacer"></div>${buttonElements}</div>`;
    }

    protected onOK()
    {
        this.dispatchCloseEvent(true, this.value);
        this.remove();
    }

    protected onCancel()
    {
        this.dispatchCloseEvent(false);
        this.remove();
    }

    protected onInputChange(event: ILineEditChangeEvent)
    {
        this.value = event.detail.text;
    }
}