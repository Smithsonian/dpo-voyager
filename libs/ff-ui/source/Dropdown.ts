/**
 * FF Typescript Foundation Library
 * Copyright 2019 Ralph Wiedemeier, Frame Factory GmbH
 *
 * License: MIT
 */

import { customElement, property, html, PropertyValues } from "./CustomElement";

import Button from "./Button";
import "./Menu";
import { IMenuItem } from "./Menu";

////////////////////////////////////////////////////////////////////////////////

export type DropdownDirection = "up" | "down";
export type DropdownAlign = "left" | "right";

@customElement("ff-dropdown")
export default class Dropdown extends Button
{
    /** Direction of the dropdown menu. Possible values: "down" (default), "up". */
    @property({ type: String })
    direction: DropdownDirection = "down";

    @property({ type: String })
    align: DropdownAlign = "left";

    /** Items to be displayed in the dropdown menu. */
    @property({ attribute: false })
    items: Array<IMenuItem | string> = [];

    @property({ type: Number })
    itemIndex = -1;


    constructor()
    {
        super();
        this.caret = true;

        this.onKeyOrPointer = this.onKeyOrPointer.bind(this);
        this.onKeyDown = this.onKeyDown.bind(this);
    }

    protected firstConnected()
    {
        super.firstConnected();
        this.classList.add("ff-dropdown");
    }

    protected connected()
    {
        super.connected();
        document.addEventListener("pointerdown", this.onKeyOrPointer, { capture: true, passive: true });
        document.addEventListener("keyup", this.onKeyOrPointer, { capture: true, passive: true });
    }

    protected disconnected()
    {
        super.disconnected();
        document.removeEventListener("pointerdown", this.onKeyOrPointer);
        document.removeEventListener("keyup", this.onKeyOrPointer);
    }

    protected render()
    {
        const classes = (this.direction === "up" ? "ff-position-above " : "ff-position-below ")
            + (this.align === "right" ? "ff-align-right" : "ff-align-left");

        const menu = this.selected ? html`<ff-menu class=${classes} .items=${this.items} itemIndex=${this.itemIndex} setFocus></ff-menu>` : null;
        return html`${super.render()}${menu}`;
    }

    protected onClick(event: MouseEvent)
    {
        this.selected = !this.selected;
        if (!this.selected) {
            setTimeout(() => this.focus(), 0);
        }
    }



    protected onKeyDown(event: KeyboardEvent)
    {
        super.onKeyDown(event);

        // on escape key close the dropdown menu
        if (event.code === "Escape" && this.selected) {
            this.selected = false;
        }
    }

    protected onKeyOrPointer(event: UIEvent)
    {
        // if pointer goes down outside this close the dropdown menu
        if (this.selected && !(event.target instanceof Node && this.contains(event.target))) {
            this.selected = false;
        }
    }
}