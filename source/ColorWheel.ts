/**
 * FF Typescript Foundation Library
 * Copyright 2019 Ralph Wiedemeier, Frame Factory GmbH
 *
 * License: MIT
 */

import Color from "@ff/core/Color";
import CustomElement, { customElement, property, html } from "./CustomElement";

////////////////////////////////////////////////////////////////////////////////

@customElement("ff-color-wheel")
export default class ColorWheel extends CustomElement
{
    @property({ attribute: false })
    color: Color | number[] = null;

    protected firstConnected()
    {
        this.setStyle({
            display: "flex"
        });

        this.classList.add("ff-control", "ff-color-wheel");
    }

    protected render()
    {
        return html``;
    }
}