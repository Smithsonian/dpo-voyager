/**
 * 3D Foundation Project
 * Copyright 2018 Smithsonian Institution
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import * as THREE from "three";

import Publisher, { IPublisherEvent } from "@ff/core/Publisher";
import { IManipPointerEvent, IManipTriggerEvent } from "@ff/browser/ManipTarget";

import RenderSystem from "../../core/app/RenderSystem";
import RenderContext from "../../core/app/RenderContext";

import Viewport, {
    EViewportCameraType,
    EViewportCameraView,
    IViewportPointerEvent,
    IViewportTriggerEvent
} from "../../core/app/Viewport";

////////////////////////////////////////////////////////////////////////////////

const _vec2 = new THREE.Vector2();

export enum EViewportLayout { Single, HorizontalSplit, VerticalSplit, Quad }

export interface IViewportManip
{
    onPointer: (event: IViewportPointerEvent) => boolean;
    onTrigger: (event: IViewportTriggerEvent) => boolean;
}

// export interface IViewportLayoutChangeEvent extends IPublisherEvent<QuadViewport>
// {
//     layout: EViewportLayout;
//     viewports: Viewport[];
// }

export default class QuadViewport extends Publisher<QuadViewport>
{
    next: IViewportManip;

    protected _layout: EViewportLayout = -1;
    protected _horizontalPosition: number = 0.5;
    protected _verticalPosition: number = 0.5;

    protected _canvasWidth: number = 100;
    protected _canvasHeight: number = 100;

    protected _renderer: THREE.WebGLRenderer;
    //protected _renderContext = new RenderContext();
    protected _viewports: Viewport[] = [];
    protected _activeViewport: Viewport = null;

    constructor(renderer: THREE.WebGLRenderer)
    {
        super();
        //this.addEvent("layout");

        this.onPointer = this.onPointer.bind(this);
        this.onTrigger = this.onTrigger.bind(this);

        this._renderer = renderer;
        this.layout = EViewportLayout.Single;
    }

    renderViewports(scene: THREE.Scene, camera: THREE.Camera)
    {
        this._viewports.forEach(viewport => {
            viewport.sceneCamera = camera;
            viewport.updateCamera();
            viewport.render(this._renderer, scene);
        });
    }

    // forEachViewport(callback: (viewport: Viewport, index: number) => void)
    // {
    //     this._viewports.forEach(callback);
    // }

    get layout()
    {
        return this._layout;
    }

    set layout(layout: EViewportLayout)
    {
        if (layout === this._layout) {
            return;
        }

        this._layout = layout;

        const viewports = this._viewports;
        const h = this._horizontalPosition;
        const v = this._verticalPosition;

        switch(layout) {
            case EViewportLayout.Single:
                viewports.length = 1;
                viewports[0] = new Viewport(0, 0, 1, 1);
                break;

            case EViewportLayout.HorizontalSplit:
                viewports.length = 2;
                viewports[0] = new Viewport(0, 0, h, 1);
                viewports[1] = new Viewport(h, 0, 1-h, 1);
                break;

            case EViewportLayout.VerticalSplit:
                viewports.length = 2;
                viewports[0] = new Viewport(0, 0, 1, v);
                viewports[1] = new Viewport(0, v, 1, 1-v);
                break;

            case EViewportLayout.Quad:
                viewports.length = 4;
                viewports[0] = new Viewport(0, 0, h, v);
                viewports[1] = new Viewport(h, 0, 1-h, v).setCamera(EViewportCameraType.Orthographic, EViewportCameraView.Top);
                viewports[2] = new Viewport(0, v, h, 1-v).setCamera(EViewportCameraType.Orthographic, EViewportCameraView.Left);
                viewports[3] = new Viewport(h, v, 1-h, 1-v).setCamera(EViewportCameraType.Orthographic, EViewportCameraView.Front);
                break;
        }

        viewports.forEach((viewport, index) => {
            viewport.index = index;
            viewport.setCanvasSize(this._canvasWidth, this._canvasHeight);
        });

        //this.emit<IViewportLayoutChangeEvent>("layout", { viewports, layout: layout });
    }

    // get horizontalSplit()
    // {
    //     return this._horizontalSplit;
    // }
    //
    // get verticalSplit()
    // {
    //     return this._verticalSplit;
    // }

    enableHomeGrid(state: boolean)
    {
        this._viewports.forEach(viewport => viewport.enableHomeGrid(state));
    }

    setSplit(h: number, v: number)
    {
        const viewports = this._viewports;
        const layoutMode = this._layout;

        this._horizontalPosition = h;
        this._verticalPosition = v;

        switch(layoutMode) {
            case EViewportLayout.HorizontalSplit:
                viewports[0].set(0, 0, h, 1);
                viewports[1].set(h, 0, 1-h, 1);
                break;

            case EViewportLayout.VerticalSplit:
                viewports[0].set(0, 0, 1, v);
                viewports[1].set(0, v, 1, 1-v);
                break;

            case EViewportLayout.Quad:
                viewports[0].set(0, 0, h, v);
                viewports[1].set(h, 0, 1-h, v);
                viewports[2].set(0, v, h, 1-v);
                viewports[3].set(h, v, 1-h, 1-v);
        }
    }

    setCanvasSize(width: number, height: number)
    {
        this._canvasWidth = width;
        this._canvasHeight = height;

        this._viewports.forEach(viewport => viewport.setCanvasSize(width, height));
    }

    onPointer(event: IManipPointerEvent)
    {
        const vpEvent: Partial<IViewportPointerEvent> = event;

        const rect = (vpEvent.originalEvent.currentTarget as HTMLElement).getBoundingClientRect();
        const x = vpEvent.centerX - rect.left;
        const y = vpEvent.centerY - rect.top;

        if ((event.pointerCount === 0 && event.type === "move") || (event.isPrimary && event.type === "down")) {
            this._activeViewport = vpEvent.viewport = this._viewports.find(viewport => viewport.isPointInside(x, y));
        }
        else {
            vpEvent.viewport = this._activeViewport;
        }

        if (vpEvent.viewport) {
            vpEvent.viewport.getDeviceCoords(x, y, _vec2);
            vpEvent.deviceX = _vec2.x;
            vpEvent.deviceY = _vec2.y;
        }
        else {
            vpEvent.deviceX = 0;
            vpEvent.deviceY = 0;
        }

        if (this.next) {
            return this.next.onPointer(vpEvent as IViewportPointerEvent);
        }

        return false;
    }

    onTrigger(event: IManipTriggerEvent)
    {
        const vpEvent: Partial<IViewportTriggerEvent> = event;

        const rect = (vpEvent.originalEvent.currentTarget as HTMLElement).getBoundingClientRect();
        const x = vpEvent.centerX - rect.left;
        const y = vpEvent.centerY - rect.top;

        vpEvent.viewport = this._viewports.find(viewport => viewport.isPointInside(x, y)) || null;

        if (vpEvent.viewport) {
            vpEvent.viewport.getDeviceCoords(x, y, _vec2);
            vpEvent.deviceX = _vec2.x;
            vpEvent.deviceY = _vec2.y;
        }
        else {
            vpEvent.deviceX = 0;
            vpEvent.deviceY = 0;
        }

        if (this.next) {
            return this.next.onTrigger(vpEvent as IViewportTriggerEvent);
        }

        return false;
    }
}