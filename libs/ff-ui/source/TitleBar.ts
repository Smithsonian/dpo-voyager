/**
 * FF Typescript Foundation Library
 * Copyright 2019 Ralph Wiedemeier, Frame Factory GmbH
 *
 * License: MIT
 */

import "./Button";
import DragHelper, { IDragTarget } from "./DragHelper";
import CustomElement, { customElement, property, html, PropertyValues } from "./CustomElement";

////////////////////////////////////////////////////////////////////////////////

@customElement("ff-title-bar")
export default class TitleBar extends CustomElement implements IDragTarget
{
    @property({ type: String })
    title = "";

    @property({ type: Boolean })
    draggable = false;

    @property({ type: Boolean })
    closable = false;

    private _dragHelper: DragHelper;


    constructor()
    {
        super();

        this._dragHelper = new DragHelper(this);
    }

    dragStart()
    {
    }

    dragMove(event: PointerEvent, dx: number, dy: number)
    {
        const parent = this.parentElement;

        const x = parent.offsetLeft;
        parent.style.left = `${x + dx}px`;

        const y = parent.offsetTop;
        parent.style.top = `${y + dy}px`;
    }

    dragEnd()
    {
    }

    protected update(changedProperties: PropertyValues)
    {
        this._dragHelper.isEnabled = this.draggable;
        this.style.cursor = this.draggable ? "pointer" : "default";

        super.update(changedProperties);
    }

    protected render()
    {
        const title = this.title || " ";
        const closeIcon = this.closable ? html`<ff-button inline icon="close"></ff-button>` : null;

        return html`<div class="ff-text ff-ellipsis">${title}</div>${closeIcon}`;
    }

    protected firstUpdated()
    {
        this.classList.add("ff-flex-row", "ff-title-bar");
    }

}