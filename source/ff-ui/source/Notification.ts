/**
 * FF Typescript Foundation Library
 * Copyright 2019 Ralph Wiedemeier, Frame Factory GmbH
 *
 * License: MIT
 */

import "./Icon";

import CustomElement, { customElement, property, html, PropertyValues } from "./CustomElement";

////////////////////////////////////////////////////////////////////////////////

type NotificationLevel = "info" | "success" | "warning" | "error";

const _levelClasses = {
    "info": "ff-info",
    "success": "ff-success",
    "warning": "ff-warning",
    "error": "ff-error"
};

const _levelIcons = {
    "info": "info",
    "success": "check",
    "warning": "warning",
    "error": "error"
};

const _levelTimeouts = {
    "info": 2000,
    "success": 2000,
    "warning": 5000,
    "error": 0
};

@customElement("ff-notification")
export default class Notification extends CustomElement
{
    static readonly stackId: string = "ff-notification-stack";

    static show(message: string, level?: NotificationLevel, timeout?: number)
    {
        new Notification(message, level, timeout);
    }

    public static shadowRootNode: ShadowRoot = null;

    @property({ type: String })
    message: string;

    @property({ type: String })
    level: NotificationLevel;

    @property({ type: Number })
    timeout: number;

    private _handler = 0;

    constructor(message?: string, level?: NotificationLevel, timeout?: number)
    {
        super();

        this.on("transitionend", this.remove.bind(this));

        this.message = message || "<messge>";
        this.level = level || "info";
        this.timeout = timeout !== undefined ? timeout : _levelTimeouts[this.level];

        const root = Notification.shadowRootNode || document;

        const stack = root.getElementById(Notification.stackId);
        if (stack) {
            stack.appendChild(this);
        }
        else {
            console.warn(`element '#${Notification.stackId}' not found`);
        }
    }

    close()
    {
        if (this._handler > 0) {
            window.clearTimeout(this._handler);
            this._handler = 0;
        }

        this.classList.add("ff-out");
    }

    protected firstUpdated()
    {
        this.classList.add("ff-notification", _levelClasses[this.level]);

        if (this.timeout > 0) {
            this._handler = window.setTimeout(() => this.close(), this.timeout);
        }
    }

    protected render()
    {
        const icon = _levelIcons[this.level];
        return html`<ff-icon name=${icon}></ff-icon>
            <div class="ff-text">${this.message}</div>
            <ff-button inline icon="close" @click=${this.onClose}>`;
    }

    protected onClose(event: MouseEvent)
    {
        event.stopPropagation();
        this.close();
    }
}

export const info = (message: string, timeout?: number) => new Notification(message, "info", timeout);
export const success = (message: string, timeout?: number) => new Notification(message, "success", timeout);
export const warning = (message: string, timeout?: number) => new Notification(message, "warning", timeout);
export const error = (message: string, timeout?: number) => new Notification(message, "error", timeout);
