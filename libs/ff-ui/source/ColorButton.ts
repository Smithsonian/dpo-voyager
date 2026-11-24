/**
 * FF Typescript Foundation Library
 * Copyright 2019 Ralph Wiedemeier, Frame Factory GmbH
 *
 * License: MIT
 */

import PopupButton from "./PopupButton";
import { showPopover } from "./popover";
import ColorEdit, { Color, IColorEditChangeEvent } from "./ColorEdit";


import { customElement, property, PropertyValues } from "./CustomElement";

////////////////////////////////////////////////////////////////////////////////

export { IColorEditChangeEvent };

@customElement("ff-color-button")
export default class ColorButton extends PopupButton
{
    @property({ attribute: false })
    color = new Color();

    @property({ type: Boolean })
    alpha = false;

    @property({ type: Boolean })
    numeric = false;

    protected popup: HTMLElement = null;


    protected firstConnected()
    {
        super.firstConnected();
        this.classList.add("ff-color-button");
    }

    protected showPopup()
    {
        const edit = new ColorEdit();
        edit.color.copy(this.color);
        edit.alpha = this.alpha;
        edit.numeric = this.numeric;

        // opening and closing are handled by PopupButton
        const popup = this.popup = this.appendElement("div");
        popup.setAttribute("popover", "manual");
        popup.appendChild(edit);

        showPopover(popup, this, { x: "end" });
    }

    protected hidePopup()
    {
        this.removeChild(this.popup);
        this.popup = null;
    }

    protected update(changedProperties: PropertyValues)
    {
        this.style.backgroundColor = this.color.toString();
        super.update(changedProperties);
    }
}