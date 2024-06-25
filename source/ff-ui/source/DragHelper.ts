/**
 * FF Typescript Foundation Library
 * Copyright 2019 Ralph Wiedemeier, Frame Factory GmbH
 *
 * License: MIT
 */

export interface IDragTarget extends HTMLElement
{
    dragStart: (event: PointerEvent) => void;
    dragMove: (event: PointerEvent, dx: number, dy: number) => void;
    dragEnd: (event: PointerEvent) => void;
}

export default class DragHelper
{
    readonly target: IDragTarget;

    isEnabled = true;

    private _isDragging = false;

    private _startX = 0;
    private _startY = 0;

    private _lastX = 0;
    private _lastY = 0;

    constructor(target: IDragTarget)
    {
        this.target = target;

        this.onPointerDown = this.onPointerDown.bind(this);
        this.onPointerMove = this.onPointerMove.bind(this);
        this.onPointerUp = this.onPointerUp.bind(this);

        target.addEventListener("pointerdown", this.onPointerDown);
        target.addEventListener("pointermove", this.onPointerMove);
        target.addEventListener("pointerup", this.onPointerUp);
        target.addEventListener("pointercancel", this.onPointerUp);
    }

    get isDragging() {
        return this._isDragging;
    }
    get startX() {
        return this._startX;
    }
    get startY() {
        return this._startY;
    }

    onPointerDown(event: PointerEvent)
    {
        if (event.isPrimary && this.isEnabled) {
            this._isDragging = true;

            this._startX = this._lastX = event.clientX;
            this._startY = this._lastY = event.clientY;

            this.target.setPointerCapture(event.pointerId);
            this.target.dragStart(event);
        }

        event.stopPropagation();
        event.preventDefault();
    }

    onPointerMove(event: PointerEvent)
    {
        if (event.isPrimary && this._isDragging) {

            const dx = event.clientX - this._lastX;
            this._lastX = event.clientX;

            const dy = event.clientY - this._lastY;
            this._lastY = event.clientY;

            this.target.dragMove(event, dx, dy);
        }

        event.stopPropagation();
        event.preventDefault();
    }

    onPointerUp(event: PointerEvent)
    {
        if (this._isDragging && event.isPrimary) {
            this.target.dragEnd(event);
            this.target.releasePointerCapture(event.pointerId);
            this._isDragging = false;
        }

        event.stopPropagation();
        event.preventDefault();
    }
}