/**
 * FF Typescript Foundation Library
 * Copyright 2019 Ralph Wiedemeier, Frame Factory GmbH
 *
 * License: MIT
 */

import CustomElement, { customElement, property } from "./CustomElement";

////////////////////////////////////////////////////////////////////////////////

export interface ISplitterChangeEvent extends CustomEvent
{
    target: Splitter;

    detail: {
        direction: SplitterDirection;
        position: number;
        isDragging: boolean;
    }
}

export type SplitterDirection = "horizontal" | "vertical";

@customElement("ff-splitter")
export default class Splitter extends CustomElement
{
    static readonly changeEvent: string = "ff-splitter-change";

    @property({ type: String })
    direction: SplitterDirection = "horizontal";

    @property({ type: Number })
    width = 5;

    @property({ type: Number })
    margin = 20;

    @property({ type: Boolean })
    detached = false;

    protected _isActive = false;
    protected _offset = 0;
    protected _position = 0;

    constructor()
    {
        super();

        this.addEventListener("pointerdown", (e) => this.onPointerDown(e));
        this.addEventListener("pointermove", (e) => this.onPointerMove(e));
        this.addEventListener("pointerup", (e) => this.onPointerUpOrCancel(e));
        this.addEventListener("pointercancel", (e) => this.onPointerUpOrCancel(e));
    }

    get position()
    {
        return this._position;
    }

    isHorizontal()
    {
        return this.direction === "horizontal";
    }

    protected update(changedProperties)
    {
        super.update(changedProperties);

        const isHorizontal = this.isHorizontal();
        const width = this.width;

        this.setStyle({
            padding: isHorizontal ? `0 ${width}px` : `${width}px 0`,
            margin: isHorizontal ? `0 ${-width}px` : `${-width}px 0`,
            cursor: isHorizontal ? "col-resize" : "row-resize"
        });
    }

    protected firstUpdated()
    {
        this.classList.add("ff-splitter");
        this.setAttribute("touch-action", "none");

        this.setStyle({
            position: "relative",
            display: "block",
            zIndex: "1",
            touchAction: "none"
        });
    }

    protected onPointerDown(event: PointerEvent)
    {
        if (event.isPrimary) {
            event.stopPropagation();
            event.preventDefault();

            this._isActive = true;

            this.setPointerCapture(event.pointerId);
            const rect = this.getBoundingClientRect();
            this._offset = this.isHorizontal()
                ? rect.left + rect.width * 0.5 - event.clientX
                : rect.top + rect.height * 0.5 - event.clientY;
        }
    }

    protected onPointerMove(event: PointerEvent)
    {
        if (event.isPrimary && this._isActive) {
            event.stopPropagation();
            event.preventDefault();

            const parent = this.parentElement;
            if (!parent) {
                return;
            }

            const rect = parent.getBoundingClientRect();

            const isHorizontal = this.isHorizontal();

            const parentSize = isHorizontal ? rect.width : rect.height;
            let position = this._offset + (isHorizontal ? event.clientX - rect.left : event.clientY - rect.top);
            let relativePosition = position / parentSize;

            if (!this.detached) {
                const prevElement = this.previousElementSibling;
                const nextElement = this.nextElementSibling;

                if (prevElement instanceof HTMLElement && nextElement instanceof HTMLElement) {
                    const children = Array.from(parent.children);
                    let splitAreaStart = 0;
                    let splitAreaSize = parentSize;
                    let visited = false;

                    children.forEach(child => {
                        if (child instanceof Splitter) {
                            return;
                        }

                        if (child === prevElement || child === nextElement) {
                            visited = true;
                            return;
                        }

                        const childRect = child.getBoundingClientRect();
                        const childSize = isHorizontal ? childRect.width : childRect.height;
                        splitAreaSize -= childSize;

                        if (!visited) {
                            splitAreaStart += childSize;
                        }
                    });

                    const minSize = this.margin;
                    const maxSize = splitAreaSize - minSize;

                    position = (position - splitAreaStart);
                    position = position < minSize ? minSize : (position > maxSize ? maxSize : position);

                    const nextSize = (splitAreaSize - position) / parentSize;
                    relativePosition = position / parentSize;

                    prevElement.style.flexBasis = (relativePosition * 100).toFixed(3) + "%";
                    nextElement.style.flexBasis = (nextSize * 100).toFixed(3) + "%";

                    // send global resize event so components can adjust to new size
                    setTimeout(() => window.dispatchEvent(new CustomEvent("resize")), 0);
                }
            }

            this._position = relativePosition;

            this.dispatchEvent(new CustomEvent(Splitter.changeEvent, {
                detail: {
                    direction: this.direction,
                    position: this._position,
                    isDragging: true
                }
            }) as ISplitterChangeEvent);
        }
    }

    protected onPointerUpOrCancel(event: PointerEvent)
    {
        if (event.isPrimary) {
            event.preventDefault();

            this._isActive = false;

            if(this._position > 0) {
                event.stopPropagation();
                this.dispatchEvent(new CustomEvent(Splitter.changeEvent, {
                    detail: {
                        direction: this.direction,
                        position: this._position,
                        isDragging: false
                    }
                }) as ISplitterChangeEvent);
            }
        }
    }
}