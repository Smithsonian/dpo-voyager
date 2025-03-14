/**
 * FF Typescript Foundation Library
 * Copyright 2019 Ralph Wiedemeier, Frame Factory GmbH
 *
 * License: MIT
 */

import "./Button";
import { IButtonClickEvent, IButtonKeyboardEvent } from "./Button";

import CustomElement, { customElement, property, html } from "./CustomElement";

////////////////////////////////////////////////////////////////////////////////

export interface IMenuItem
{
    index?: number;
    name?: string;
    text?: string;
    icon?: string;
    checked?: boolean;
    disabled?: boolean;
    divider?: boolean;
    selectedIndex?: number;
    selected?: boolean;
}

export interface IMenuSelectEvent extends CustomEvent
{
    type: "select";
    target: Menu;
    detail: {
        item: IMenuItem;
    }
}

@customElement("ff-menu")
export default class Menu extends CustomElement
{
    static readonly iconChecked = "fas fa-check";

    /** Optional name to identify the dropdown. */
    @property({ type: String })
    name = "";

    /** Optional index to identify the dropdown. */
    @property({ type: Number })
    index = 0;

    /** Entries to be displayed in the dropdown menu. */
    @property({ attribute: false })
    items: Array<IMenuItem | string> = null;

    @property({ type: Number })
    itemIndex = -1;

    @property({ type: Boolean })
    setFocus = false;


    protected firstConnected()
    {
        this.setAttribute("role", "menu");
        this.classList.add("ff-menu");
    }

    protected render()
    {
        if (!this.items) {
            return html``;
        }

       return html`${this.items.map((item, index) => this.renderItem(item, index))}`;
    }

    protected renderItem(item: IMenuItem | string, index: number)
    {
        let text, icon;

        if (typeof item === "string") {
            text = item;
            icon = "empty";
        }
        else if (item.divider) {
            return html`<div class="ff-divider"></div>`;
        }
        else {
            text = item.text;
            icon = item.icon || (item.checked ? "check" : "empty");
        }

        return html`<ff-button index=${index} selectedIndex=${this.itemIndex}
            icon=${icon} text=${text} @click=${this.onClick} @keydown=${this.onKeyDown}></ff-button>`;
    }

    updated()
    {
        if (this.setFocus) {
            const index = this.itemIndex >= 0 ? this.itemIndex : 0;
            this.focusItem(index);
        }
    }

    protected focusItem(index: number)
    {
        const child = this.children.item(index);

        if (child instanceof HTMLElement) {
            child.focus();
        }
    }

    protected onClick(event: IButtonClickEvent)
    {
        const item = this.items[event.target.index];

        if (!item) {
            return;
        }

        this.dispatchEvent(new CustomEvent("select", {
            detail: { item },
            bubbles: true
        }) as IMenuSelectEvent);
    }

    protected onKeyDown(event: IButtonKeyboardEvent)
    {
        const items = this.items;

        if (event.code === "ArrowDown") {
            let index = event.target.index;
            do { index = (index + 1) % items.length } while (items[index]["divider"]);
            this.focusItem(index);
        }
        else if (event.code === "ArrowUp") {
            let index = event.target.index;
            do { index = (index + items.length - 1) % items.length } while (items[index]["divider"]);
            this.focusItem(index);
        }
    }
}