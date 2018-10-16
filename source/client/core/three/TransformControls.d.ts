import { Camera, Object3D } from "three";
import { IViewportPointerEvent, IViewportTriggerEvent } from "./Viewport";

export class TransformControls extends Object3D
{
    constructor();

    camera: Camera;

    size: number;

    space: string;

    object: Object3D;

    update(): void;

    detach(): void;

    attach(object: Object3D): void;

    onPointer(event: IViewportPointerEvent);
    onTrigger(event: IViewportTriggerEvent);

    getMode(): string;

    setMode(mode: string): void;

    setSnap(snap: any): void;

    setSize(size: number): void;

    setSpace(space: string): void;

    setTranslationSnap(size: number): void;

    setRotationSnap(size: number): void;

}
