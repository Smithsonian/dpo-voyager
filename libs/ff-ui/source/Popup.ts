/**
 * FF Typescript Foundation Library
 * Copyright 2019 Ralph Wiedemeier, Frame Factory GmbH
 *
 * License: MIT
 */

import CustomElement, { customElement, property, html, PropertyValues } from "./CustomElement";

////////////////////////////////////////////////////////////////////////////////

export { customElement, property, html, PropertyValues };

export type PopupPosition = "fixed" | "anchor" | "center";
export type PopupAlign = "start" | "center" | "end" | "fixed";
export type PopupJustify = PopupAlign;

@customElement("ff-popup")
export default class Popup extends CustomElement
{
    @property({ attribute: false })
    anchor: HTMLElement = null;

    @property({ attribute: false })
    portal: HTMLElement = null;

    @property({ type: String })
    position: PopupPosition = undefined;

    @property({ type: String })
    align: PopupAlign = undefined;

    @property({ type: String })
    justify: PopupJustify = undefined;

    @property({ type: Number })
    positionX = 0;

    @property({ type: Number })
    positionY = 0;

    @property({ type: Number })
    offsetX = 0;

    @property({ type: Number })
    offsetY = 0;

    @property({ type: Boolean })
    keepVisible: boolean = false;

    @property({ type: Boolean })
    modal: boolean = false;

    private _modalPlane: HTMLElement = null;

    constructor()
    {
        super();
        this.onResize = this.onResize.bind(this);
        this.onCaptureEvent = this.onCaptureEvent.bind(this);
        this.onEatEvent = this.onEatEvent.bind(this);
    }

    close()
    {
        this.dispatchEvent(new CustomEvent("close"));
    }

    protected connected()
    {
        this.calculatePosition();

        window.addEventListener("resize", this.onResize);

        if (this.modal) {
            const modalPlane = this._modalPlane = this.createElement("div");

            modalPlane.classList.add("ff-modal-plane");
            modalPlane.addEventListener("mousedown", this.onEatEvent);
            modalPlane.addEventListener("contextmenu", this.onEatEvent);
            modalPlane.addEventListener("pointerdown", this.onEatEvent);

            this.parentElement.appendChild(modalPlane);
            setTimeout(() => modalPlane.classList.add("ff-transition"));
        }
        else {
            document.addEventListener("mousedown", this.onCaptureEvent, { capture: true, passive: true });
        }
    }

    protected disconnected()
    {
        window.removeEventListener("resize", this.onResize);

        if (this._modalPlane) {
            this._modalPlane.remove();
            this._modalPlane = null;
        }
        else {
            document.removeEventListener("mousedown", this.onCaptureEvent);
        }
    }

    protected firstConnected()
    {
        super.firstConnected();

        this.setStyle({
            position: this.position == "center" ? "absolute" : "fixed",
            zIndex: "1000"
        });

        this.classList.add("ff-popup");
    }

    protected updated()
    {
        if (this.isConnected) {
            this.calculatePosition();
        }
    }

    protected calculatePosition()
    {
        let anchorRect, portalRect;
        const thisRect = this.getBoundingClientRect();

        if (this.portal) {
            portalRect = this.portal.getBoundingClientRect();
        }
        else {
            portalRect = {
                left: 0,
                top: 0,
                right: window.innerWidth,
                bottom: window.innerHeight,
                width: window.innerWidth,
                height: window.innerHeight
            };
        }

        let position;

        if (this.position === "center") {
            position = this.center(thisRect, portalRect);
        }
        else if (this.position === "anchor") {
            const anchor = this.anchor || this.parentElement;
            if (anchor) {
                anchorRect = anchor.getBoundingClientRect();
                position = this.positionToAnchor(thisRect, anchorRect, portalRect);
            }
        }
        else {
            position = { x: this.positionX, y: this.positionY };
        }

        if (this.keepVisible && this.position !== "center") {
            position = this.keepElementVisible(position, thisRect, portalRect);
        }

        this.style.left = Math.round(position.x) + "px";
        this.style.top = Math.round(position.y) + "px";
    }

    protected center(thisRect: ClientRect, portalRect: ClientRect)
    {
        return {
            x: Math.round((portalRect.width - thisRect.width) * 0.5),
            y: Math.round((portalRect.height - thisRect.height) * 0.5)
        };
    }

    protected positionToAnchor(thisRect: ClientRect, anchorRect: ClientRect, portalRect: ClientRect)
    {
        const align = this.align;
        const justify = this.justify;
        const offsetX = this.offsetX;
        const offsetY = this.offsetY;

        const position = { x: 0, y: 0 };

        switch(align) {
            case "start":
                position.x = justify !== "start" && justify !== "end"
                    ? anchorRect.left - thisRect.width - offsetX
                    : anchorRect.left;
                break;
            case "end":
                position.x = justify !== "start" && justify !== "end"
                    ? anchorRect.right + offsetX
                    : anchorRect.right - thisRect.width;
                break;
            case "fixed":
                position.x = this.positionX;
                break;
            default:
                position.x = anchorRect.left + (anchorRect.width - thisRect.width) * 0.5;
                break;
        }

        switch(justify) {
            case "start":
                position.y = anchorRect.top - thisRect.height - offsetY;
                break;
            case "end":
                position.y = anchorRect.bottom + offsetY;
                break;
            case "fixed":
                position.y = this.positionY;
                break;
            default:
                position.y = anchorRect.top + (anchorRect.height - thisRect.height) * 0.5;
                break;
        }

        position.x += this.offsetX;
        position.y += this.offsetY;

        return position;
    }

    protected keepElementVisible(position: { x: number, y: number }, thisRect: ClientRect, portalRect: ClientRect)
    {
        const offsetX = this.offsetX;
        const offsetY = this.offsetY;

        if (thisRect.width > portalRect.width) {
            position.x = (portalRect.width - thisRect.width) * 0.5;
        }
        else if (position.x < portalRect.left + offsetX) {
            position.x = portalRect.left + offsetX;
        }
        else if (position.x + thisRect.width + offsetX > portalRect.right) {
            position.x = portalRect.right - thisRect.width - offsetX;
        }

        if (thisRect.height > portalRect.height) {
            position.y = (portalRect.height - thisRect.height) * 0.5;
        }
        else if (position.y < portalRect.top + offsetY) {
            position.y = portalRect.top + offsetY;
        }
        else if (position.y + thisRect.height + offsetY > portalRect.bottom) {
            position.y = portalRect.bottom - thisRect.height - offsetY;
        }

        return position;
    }

    protected onResize()
    {
        this.calculatePosition();
    }

    protected onCaptureEvent(event: Event)
    {
        if (event.target instanceof Node && this.contains(event.target)) {
            return;
        }

        this.close();
    }

    protected onEatEvent(event: Event)
    {
        console.log("Popup.onEatEvent");
        event.stopPropagation();
        event.preventDefault();
    }
}