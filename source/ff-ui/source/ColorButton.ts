/**
 * FF Typescript Foundation Library
 * Copyright 2019 Ralph Wiedemeier, Frame Factory GmbH
 *
 * License: MIT
 */

import PopupButton from "./PopupButton";
import Popup from "./Popup";
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

    protected popup: Popup = null;


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

        const popup = this.popup = new Popup();
        popup.appendElement(edit);
        this.appendElement(popup);

        popup.anchor = this;
        popup.keepVisible = true;
        popup.align = "end";
        popup.justify = "end";
        popup.position = "anchor";
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