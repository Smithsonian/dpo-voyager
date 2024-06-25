/**
 * FF Typescript Foundation Library
 * Copyright 2019 Ralph Wiedemeier, Frame Factory GmbH
 *
 * License: MIT
 */

import Button from "./Button";

import { customElement, property, PropertyValues } from "./CustomElement";

////////////////////////////////////////////////////////////////////////////////

@customElement("ff-popup-button")
export default class PopupButton extends Button
{
    @property({ attribute: false })
    content: HTMLElement = null;

    @property({ attribute: false })
    contentParent: HTMLElement = this;

    constructor()
    {
        super();
        this.addEventListener("close", () => this.selected = false);

        this.onPointerDown = this.onPointerDown.bind(this);
        this.onKeyDown = this.onKeyDown.bind(this);
    }

    protected connected()
    {
        document.addEventListener("pointerdown", this.onPointerDown, { capture: true, passive: true });
        document.addEventListener("keydown", this.onKeyDown, { capture: true, passive: true });

    }

    protected disconnected()
    {
        document.removeEventListener("pointerdown", this.onPointerDown);
        document.removeEventListener("keydown", this.onKeyDown);

    }

    protected update(changedProperties: PropertyValues)
    {
        super.update(changedProperties);

        if (changedProperties.has("selected")) {
            if (this.selected) {
                this.showPopup();
            }
            else if (changedProperties.get("selected"))  {
                this.hidePopup();
            }
        }
    }

    protected onPointerDown(event: PointerEvent)
    {
        if (event.target instanceof Node && !this.contains(event.target)) {
            this.selected = false;
        }
    }

    protected onKeyDown(event: KeyboardEvent)
    {
        if (event.key === "Escape") {
            this.selected = false;
        }
    }

    protected showPopup()
    {
        const contentElement = this.content;
        const parentElement = this.contentParent || this;

        if (contentElement) {
            parentElement.appendChild(contentElement);
            setTimeout(() => contentElement.style.opacity = "1.0", 0);
        }
    }

    protected hidePopup()
    {
        const contentElement = this.content;
        const parentElement = this.contentParent || this;

        if (contentElement && contentElement.parentElement === parentElement) {
            this.focus();
            contentElement.style.opacity = "0";
            const duration = parseFloat(window.getComputedStyle(contentElement).transitionDuration) || 0;
            setTimeout(() => parentElement.removeChild(contentElement), duration * 1000);
        }
    }
}