/**
 * FF Typescript Foundation Library
 * Copyright 2020 Ralph Wiedemeier, Frame Factory GmbH
 *
 * License: MIT
 */

import {
    WebGLRenderer,
    WebGLRenderTarget,
    Camera,
    Vector2,
    Box3,
} from "three";

import Publisher, { ITypedEvent } from "@ff/core/Publisher";

import {
    IBaseEvent as IManipBaseEvent,
    IKeyboardEvent,
    IPointerEvent as IManipPointerEvent,
    ITriggerEvent as IManipTriggerEvent
} from "@ff/browser/ManipTarget";

import UniversalCamera, { EProjection, EViewPreset } from "./UniversalCamera";

import ViewportOverlay, { ELocation } from "./ui/ViewportOverlay";
import CameraController from "./CameraController";

////////////////////////////////////////////////////////////////////////////////

export interface IBaseEvent extends IManipBaseEvent
{
    viewport: Viewport | null;
    deviceX: number;
    deviceY: number;
}

export interface IPointerEvent extends IManipPointerEvent, IBaseEvent { }
export interface ITriggerEvent extends IManipTriggerEvent, IBaseEvent { }

export interface IViewportManip
{
    onPointer: (event: IPointerEvent) => boolean;
    onTrigger: (event: ITriggerEvent) => boolean;
}

export interface IViewportRect
{
    x: number;
    y: number;
    width: number;
    height: number;
}

export interface IViewportDisposeEvent extends ITypedEvent<"dispose">
{
    viewport: Viewport;
}

export interface IViewportProps
{
    x?: number;
    y?: number;
    width?: number;
    height?: number;
    overlay?: ViewportOverlay;
}

export default class Viewport extends Publisher implements IViewportManip
{
    next: IViewportManip = null;

    private _relRect: IViewportRect;
    private _absRect: IViewportRect;

    private _canvasWidth = 1;
    private _canvasHeight = 1;

    private _overlay: ViewportOverlay = null;
    private _camera: UniversalCamera = null;
    private _controller: CameraController = null;

    constructor(props?: IViewportProps)
    {
        super();
        this.addEvent("dispose");

        this.next = null;

        props = props || {};

        this._relRect = {
            x: props.x || 0,
            y: props.y || 0,
            width: props.width || 1,
            height: props.height || 1
        };

        this._absRect = {
            x: 0,
            y: 0,
            width: 1,
            height: 1
        };

        if (props.overlay) {
            this._overlay = props.overlay;
        }
    }

    /**
     * The x-coordinate of the viewport's bottom-left corner in canvas pixels. The origin is at the bottom left.
     */
    get x() {
        return this._absRect.x;
    }

    /**
     * The y-coordinate of the viewport's bottom-left corner in canvas pixels. The origin is at the bottom left.
     */
    get y() {
        return this._absRect.y;
    }

    /**
     * The viewport's width in canvas pixels.
     */
    get width() {
        return this._absRect.width;
    }

    /**
     * The viewport's height in canvas pixels.
     */
    get height() {
        return this._absRect.height;
    }

    /** The width of the canvas in pixels. */
    get canvasWidth() {
        return this._canvasWidth;
    }

    /**
     * The height of the canvas in pixels.
     */
    get canvasHeight() {
        return this._canvasHeight;
    }

    /** The viewport's built-in camera. */
    get camera(): UniversalCamera | null {
        return this._camera;
    }

    /**
     * The controller of the build-in camera.
     */
    get controller(): CameraController | null {
        return this._controller;
    }

    /**
     * The viewport's overlay HTML element.
     */
    get overlay() {
        return this._overlay;
    }
    set overlay(overlay: ViewportOverlay) {
        this._overlay = overlay;
        this.updateGeometry();
    }

    /**
     * Frees all resources the viewport object may have claimed.
     */
    dispose()
    {
        if (ENV_DEVELOPMENT) {
            console.log("Viewport.dispose - " + this.toString());
        }

        this.emit<IViewportDisposeEvent>({ type: "dispose", viewport: this });

        if (this._overlay) {
            this._overlay.remove();
            this._overlay = null;
        }
    }

    /**
     * Sets the size of the viewport in relative coordinates (origin at the bottom left, canvas width and height are 1).
     */
    setSize(x?: number, y?: number, width?: number, height?: number)
    {
        const relRect = this._relRect;
        relRect.x = x;
        relRect.y = y;
        relRect.width = width;
        relRect.height = height;

        this.updateGeometry();
    }

    /**
     *  Sets the size of the rendering canvas in pixels.
     */
    setCanvasSize(width: number, height: number)
    {
        this._canvasWidth = width;
        this._canvasHeight = height;

        this.updateGeometry();

        if (this._controller) {
            this._controller.setViewportSize(width, height);
        }
    }

    /** Creates or updates a built-in camera for the viewport. This camera will be used for rendering
     * instead of the scene camera.
     * @param type The camera's projection type (perspective or orthographic).
     * @param preset The camera's preset view (one of six principal directions).
     */
    setBuiltInCamera(type: EProjection, preset?: EViewPreset)
    {
        if (!this._camera) {
            this._camera = new UniversalCamera(type);
            this._camera.matrixAutoUpdate = false;
        }
        else {
            this._camera.setProjection(type);
        }

        if (preset !== undefined) {
            this._camera.setPreset(preset);
            this.overlay.setLabel(ELocation.TopRight, "view", EViewPreset[preset], "ff-label-box");
        }
    }

    /**
     * Removes a previously set built-in camera. The scene camera will be used for rendering.
     */
    unsetBuiltInCamera()
    {
        this._camera = null;
        this._controller = null;
        this.overlay.unsetLabel(ELocation.TopRight, "view");
    }

    enableCameraControl(state: boolean): CameraController
    {
        if (!state && this._controller) {
            this._controller = null;
        }
        else if (state && this._camera) {
            if (!this._controller) {
                this._controller = new CameraController(this._camera);
                this._controller.setViewportSize(this.width, this.height);
                this._controller.updateController();
            }
        }

        return this._controller;
    }

    /**
     * Centers and positions the built-in camera such that the given box is entirely visible.
     * Does nothing if the viewport doesn't have a built-in camera and controller.
     * @param box
     */
    zoomExtents(box: Box3)
    {
        const camera = this._camera;
        const controller = this._controller;

        if (camera && controller) {
            controller.zoomExtents(box);
            controller.updateCamera(null, true);
        }
    }

    /**
     * Tests whether the pointer coordinates of the given UI event lie inside the viewport.
     * @param event
     */
    isInside(event: IBaseEvent): boolean
    {
        return this.isPointInside(event.localX, event.localY);
    }

    isPointInside(x: number, y: number): boolean
    {
        const absRect = this._absRect;
        y = this.canvasHeight - y;

        return x >= absRect.x && x < absRect.x + absRect.width
            && y >= absRect.y && y < absRect.y + absRect.height;
    }

    /**
     * Transforms the given local screen coordinates to normalized device coordinates.
     * @param localX canvas-local x coordinate.
     * @param localY canvas-local y coordinate.
     * @param result An optional 2-vector receiving the transformed coordinates.
     */
    getDevicePoint(localX: number, localY: number, result?: Vector2): Vector2
    {
        const absRect = this._absRect;

        const ndx = ((localX - absRect.x) / absRect.width) * 2 - 1;
        const ndy = ((this.canvasHeight - localY - absRect.y) / absRect.height) * 2 - 1;

        return result ? result.set(ndx, ndy) : new Vector2(ndx, ndy);
    }

    getDeviceX(x: number): number
    {
        const absRect = this._absRect;
        return ((x - absRect.x) / absRect.width) * 2 - 1;
    }

    getDeviceY(y: number): number
    {
        const absRect = this._absRect;
        return ((this.canvasHeight - y - absRect.y) / absRect.height) * 2 - 1;
    }

    updateCamera(sceneCamera?: Camera): Camera
    {
        let currentCamera: any = sceneCamera;

        if (this._camera) {
            currentCamera = this._camera;

            if (this._controller) {
                this._controller.updateCamera();
            }
        }

        if (!currentCamera) {
            return;
        }

        const absRect = this._absRect;
        const aspect = absRect.width / absRect.height;

        if (aspect !== currentCamera.userData["aspect"]) {
            currentCamera.userData["aspect"] = aspect;
            if (currentCamera.isUniversalCamera || currentCamera.isPerspectiveCamera) {
                currentCamera.aspect = aspect;
                currentCamera.updateProjectionMatrix();
            }
            else if (currentCamera.isOrthographicCamera) {
                const dy = (currentCamera.top - currentCamera.bottom) * 0.5;
                currentCamera.left = -dy * aspect;
                currentCamera.right = dy * aspect;
                currentCamera.updateProjectionMatrix();
            }
        }

        return currentCamera;
    }

    applyViewport(renderer: WebGLRenderer)
    {
        const absRect = this._absRect;
        renderer.setViewport(absRect.x, absRect.y, absRect.width, absRect.height);
        renderer["viewport"] = this;
    }

    applyPickViewport(target: WebGLRenderTarget, event: IBaseEvent)
    {
        const absRect = this._absRect;
        const x = event.localX - absRect.x;
        const y = this.canvasHeight - event.localY - absRect.y;
        target.viewport.set(-x, -y, absRect.width, absRect.height);

        //console.log("Viewport.applyPickViewport - offset: ", -left, -top);
    }

    toViewportEvent(event: IManipPointerEvent): IPointerEvent;
    toViewportEvent(event: IManipTriggerEvent): ITriggerEvent;
    toViewportEvent(event: IManipBaseEvent): IBaseEvent
    {
        const vpEvent = event as IBaseEvent;
        vpEvent.viewport = this;
        vpEvent.deviceX = this.getDeviceX(event.localX);
        vpEvent.deviceY = this.getDeviceY(event.localY);
        return vpEvent;
    }

    onPointer(event: IPointerEvent)
    {
        if (this._controller) {
            return this._controller.onPointer(event);
        }

        return false;
    }

    onTrigger(event: ITriggerEvent)
    {
        if (this._controller) {
            return this._controller.onTrigger(event);
        }

        return false;
    }

    onKeyboard(event: IKeyboardEvent)
    {
        if (this._controller) {
            return this._controller.onKeypress(event);
        }

        return false;
    }

    toString()
    {
        return `Viewport (x: ${this.x}, y: ${this.y}, width: ${this.width}, height: ${this.height})`;
    }

    protected updateGeometry()
    {
        const relRect = this._relRect;
        const absRect = this._absRect;
        const canvasWidth = this._canvasWidth;
        const canvasHeight = this._canvasHeight;

        absRect.x = Math.round(relRect.x * canvasWidth);
        absRect.y = Math.round(relRect.y * canvasHeight);
        absRect.width = Math.round(relRect.width * canvasWidth);
        absRect.height = Math.round(relRect.height * canvasHeight);
        
        const overlay = this._overlay;
        if (overlay) {
            const top = this.canvasHeight - absRect.y - absRect.height;
            overlay.style.left = (absRect.x ? absRect.x.toFixed() + "px" : "0");
            overlay.style.top = (top ? top.toFixed() + "px" : "0");
            overlay.style.width = absRect.width.toFixed() + "px";
            overlay.style.height = absRect.height.toFixed() + "px";
        }
    }
}