/**
 * FF Typescript Foundation Library
 * Copyright 2019 Ralph Wiedemeier, Frame Factory GmbH
 *
 * License: MIT
 */

import CustomElement, { customElement } from "./CustomElement";

////////////////////////////////////////////////////////////////////////////////

/**
 * Fired after canvas is mounted and before canvas is unmounted.
 * After mounting, the canvas property contains the HTML canvas element.
 * Before unmounting, the canvas property is null.
 */
export interface ICanvasMountEvent extends CustomEvent
{
    detail: {
        /** The HTML canvas element or null if the component is about to unmount. */
        canvas: HTMLCanvasElement | null;
    }
}

/**
 * Fired after canvas (i.e. the browser window) is resized.
 * Contains the new width and height of the HTML canvas element.
 */
export interface ICanvasResizeEvent extends CustomEvent
{
    detail: {
        /** The new width of the HTML canvas element. */
        width: number;
        /** The new height of the HTML canvas element. */
        height: number;
    }
}

@customElement("ff-canvas")
export class Canvas extends CustomElement
{
    static readonly mountEvent = "ff-mount";
    static readonly resizeEvent = "ff-resize";

    protected canvas: HTMLCanvasElement;

    constructor()
    {
        super();

        this.onResize = this.onResize.bind(this);

        const canvas = this.canvas = document.createElement("canvas");
        canvas.style.display = "block";
        canvas.style.width = "100%";
        canvas.style.height = "100%";
        this.appendChild(canvas);
    }

    protected connected()
    {
        window.addEventListener("resize", this.onResize);

        this.dispatchEvent(new CustomEvent(Canvas.mountEvent, {
            detail: { canvas: this.canvas }
        }) as ICanvasMountEvent);
    }

    protected disconnected()
    {
        this.dispatchEvent(new CustomEvent(Canvas.mountEvent, {
            detail: { canvas: null }
        }) as ICanvasMountEvent);

        window.removeEventListener("resize", this.onResize);
    }

    protected onResize()
    {
        const canvas = this.canvas;
        const width = canvas.clientWidth;
        const height = canvas.clientHeight;

        this.dispatchEvent(new CustomEvent(Canvas.resizeEvent, {
            detail: { width, height }
        }) as ICanvasResizeEvent);
    }
}