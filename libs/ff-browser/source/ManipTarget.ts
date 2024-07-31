/**
 * FF Typescript Foundation Library
 * Copyright 2021 Ralph Wiedemeier, Frame Factory GmbH
 *
 * License: MIT
 */

import { ITypedEvent } from "@ff/core/Publisher";

////////////////////////////////////////////////////////////////////////////////

const _DRAG_DISTANCE = 4;

export type PointerEventType = "pointer-down" | "pointer-up" | "pointer-hover" | "pointer-move";
export type TriggerEventType = "wheel" | "double-click" | "context-menu";
export type KeyboardEventType = "keydown";
export type PointerEventSource = "mouse" | "pen" | "touch";

export interface IPointerPosition
{
    id: number;
    clientX: number;
    clientY: number;
}

export interface IBaseEvent
{
    centerX: number;
    centerY: number;
    localX: number;
    localY: number;

    shiftKey: boolean;
    ctrlKey: boolean;
    altKey: boolean;
    metaKey: boolean;
}

export interface IPointerEvent extends IBaseEvent, ITypedEvent<PointerEventType>
{
    originalEvent: PointerEvent;
    source: PointerEventSource;

    isPrimary: boolean;
    isDragging: boolean;
    activePositions: IPointerPosition[];
    pointerCount: number;

    movementX: number;
    movementY: number;
}

export interface ITriggerEvent extends IBaseEvent, ITypedEvent<TriggerEventType>
{
    originalEvent: Event;

    wheel: number;
}

export interface IKeyboardEvent extends IBaseEvent, ITypedEvent<KeyboardEventType>
{
    originalEvent: Event;

    key: string;
}

export interface IManip
{
    onPointer: (event: IPointerEvent) => boolean;
    onTrigger: (event: ITriggerEvent) => boolean;
    onKeypress: (event: IKeyboardEvent) => boolean;
}

/**
 * Composable class, listens for mouse and touch events on its target and converts
 * them to [[IPointerEvent]] and [[ITriggerEvent]] events. [[IManip]] receivers of these events
 * can be chained. Events are handed down the chain, starting with the [[IManip]] instance
 * assigned to [[ManipTarget.next]].
 */
export default class ManipTarget
{
    next: IManip = null;

    protected activePositions: IPointerPosition[] = [];
    protected activeType: string = "";

    protected centerX = 0;
    protected centerY = 0;

    protected startX = 0;
    protected startY = 0;
    protected isDragging = false;

    constructor(target?: HTMLElement)
    {
        this.onPointerDown = this.onPointerDown.bind(this);
        this.onPointerMove = this.onPointerMove.bind(this);
        this.onPointerUpOrCancel = this.onPointerUpOrCancel.bind(this);
        this.onDoubleClick = this.onDoubleClick.bind(this);
        this.onContextMenu = this.onContextMenu.bind(this);
        this.onWheel = this.onWheel.bind(this);
        this.onKeyDown = this.onKeyDown.bind(this);

        if (target) {
            target.addEventListener("pointerdown", this.onPointerDown);
            target.addEventListener("pointermove", this.onPointerMove);
            target.addEventListener("pointerup", this.onPointerUpOrCancel);
            target.addEventListener("pointercancel", this.onPointerUpOrCancel);
            target.addEventListener("contextmenu", this.onContextMenu);
            target.addEventListener("wheel", this.onWheel);
            target.addEventListener("keydown", this.onKeyDown);
        }
    }

    onPointerDown(event: PointerEvent)
    {
        // only events of a single pointer type can be handled at a time
        if (this.activeType && event.pointerType !== this.activeType) {
            return;
        }

        if (this.activePositions.length === 0) {
            this.startX = event.clientX;
            this.startY = event.clientY;
            this.isDragging = false;
        }

        this.activeType = event.pointerType;

        this.activePositions.push({
            id: event.pointerId,
            clientX: event.clientX,
            clientY: event.clientY
        });

        //(event.currentTarget as HTMLElement).setPointerCapture(event.pointerId);

        const manipEvent = this.createManipPointerEvent(event, "pointer-down");

        if (this.sendPointerEvent(manipEvent)) {
            event.stopPropagation();
        }

        //event.preventDefault();
    }

    onPointerMove(event: PointerEvent)
    {
        const activePositions = this.activePositions;

        for (let i = 0, n = activePositions.length; i < n; ++i) {
            const position = activePositions[i];
            if (event.pointerId === position.id) {
                position.clientX = event.clientX;
                position.clientY = event.clientY;
            }
        }

        if (activePositions.length > 0 && !this.isDragging) {
            const delta = Math.abs(event.clientX - this.startX) + Math.abs(event.clientY - this.startY);
            if (delta > _DRAG_DISTANCE) {
                this.isDragging = true;
            }
        }

        const eventType = activePositions.length ? "pointer-move" : "pointer-hover";
        const manipEvent = this.createManipPointerEvent(event, eventType);

        if (this.sendPointerEvent(manipEvent)) {
            event.stopPropagation();
        }

        //event.preventDefault();
    }

    onPointerUpOrCancel(event: PointerEvent)
    {
        const activePositions = this.activePositions;
        let found = false;

        for (let i = 0, n = activePositions.length; i < n; ++i) {
            if (event.pointerId === activePositions[i].id) {
                activePositions.splice(i, 1);
                found = true;
                break;
            }
        }

        if (!found) {
            //console.warn("orphan pointer up/cancel event #id", event.pointerId);
            return;
        }

        const manipEvent = this.createManipPointerEvent(event, "pointer-up");
        if (activePositions.length === 0) {
            this.activeType = "";
        }

        if (this.sendPointerEvent(manipEvent)) {
            event.stopPropagation();
        }

        event.preventDefault();
    }

    onDoubleClick(event: MouseEvent)
    {
        const consumed = this.sendTriggerEvent(
            this.createManipTriggerEvent(event, "double-click")
        );

        if (consumed) {
            event.preventDefault();
        }
    }

    onContextMenu(event: MouseEvent)
    {
        this.sendTriggerEvent(
            this.createManipTriggerEvent(event, "context-menu")
        );

        // prevent default context menu regardless of whether event was consumed or not
        event.preventDefault();
    }

    onWheel(event: WheelEvent)
    {
        const consumed = this.sendTriggerEvent(
            this.createManipTriggerEvent(event, "wheel")
        );

        if (consumed) {
            event.preventDefault();
        }
    }

    onKeyDown(event: KeyboardEvent)
    {
        const consumed = this.sendKeyboardEvent(
            this.createManipKeyboardEvent(event)
        );

        if (consumed) {
            //event.preventDefault();
        }
    }

    protected createManipPointerEvent(event: PointerEvent, type: PointerEventType): IPointerEvent
    {
        // calculate center and movement
        let centerX = 0;
        let centerY = 0;
        let localX = 0;
        let localY = 0;
        let movementX = 0;
        let movementY = 0;

        const positions = this.activePositions;
        const count = positions.length;

        if (count > 0) {
            for (let i = 0; i < count; ++i) {
                centerX += positions[i].clientX;
                centerY += positions[i].clientY;
            }

            centerX /= count;
            centerY /= count;

            if (type === "pointer-move" || type === "pointer-hover") {
                movementX = centerX - this.centerX;
                movementY = centerY - this.centerY;
            }

            this.centerX = centerX;
            this.centerY = centerY;
        }
        else {
            centerX = this.centerX;
            centerY = this.centerY;
        }

        const element = event.currentTarget;
        if (element instanceof Element) {
            const rect = element.getBoundingClientRect();
            localX = event.clientX - rect.left;
            localY = event.clientY - rect.top;
        }

        return {
            originalEvent: event,
            type: type,
            source: event.pointerType as PointerEventSource,

            isPrimary: event.isPrimary,
            isDragging: this.isDragging,
            activePositions: positions,
            pointerCount: count,

            centerX,
            centerY,
            localX,
            localY,
            movementX,
            movementY,

            shiftKey: event.shiftKey,
            ctrlKey: event.ctrlKey,
            altKey: event.altKey,
            metaKey: event.metaKey
        };
    }

    protected createManipTriggerEvent(event: MouseEvent, type: TriggerEventType): ITriggerEvent
    {
        let wheel = 0;

        if (type === "wheel") {
            wheel = (event as WheelEvent).deltaY;
        }

        let localX = 0;
        let localY = 0;

        const element = event.currentTarget;
        if (element instanceof Element) {
            const rect = element.getBoundingClientRect();
            localX = event.clientX - rect.left;
            localY = event.clientY - rect.top;
        }

        return {
            originalEvent: event,

            type,
            wheel,

            centerX: event.clientX,
            centerY: event.clientY,
            localX,
            localY,

            shiftKey: event.shiftKey,
            ctrlKey: event.ctrlKey,
            altKey: event.altKey,
            metaKey: event.metaKey
        }
    }

    protected createManipKeyboardEvent(event: KeyboardEvent): IKeyboardEvent
    {
        return {
            originalEvent: event,

            type: "keydown",
            key: event.code,

            centerX: 0,
            centerY: 0,
            localX: 0,
            localY: 0,
            shiftKey: event.shiftKey,
            ctrlKey: event.ctrlKey,
            altKey: event.altKey,
            metaKey: event.metaKey
        }
    }

    protected sendPointerEvent(event: IPointerEvent): boolean
    {
        return this.next && this.next.onPointer(event);
    }

    protected sendTriggerEvent(event: ITriggerEvent): boolean
    {
        return this.next && this.next.onTrigger(event);
    }

    protected sendKeyboardEvent(event: IKeyboardEvent): boolean
    {
        return this.next && this.next.onKeypress(event);
    }
}