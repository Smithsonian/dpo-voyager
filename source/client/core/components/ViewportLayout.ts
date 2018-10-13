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

import types from "@ff/core/ecs/propertyTypes";

import Viewport, { IViewportPointerEvent, IViewportTriggerEvent } from "../three/Viewport";
import Manip  from "./Manip";

////////////////////////////////////////////////////////////////////////////////

const _vec2 = new THREE.Vector2();

export default class ViewportLayout extends Manip
{
    static readonly type: string = "ViewportLayout";

    private static layout = [ "Single", "H-Split", "V-Split", "Quad" ];
    private static preset = [ "Left", "Right", "Top", "Bottom", "Front", "Back" ];
    private static camera = [ "Scene", "Preset" ];

    ins = this.makeProps({
        lay: types.Enum("Layout", ViewportLayout.layout),
        hsp: types.Number("Split.Horizontal", { min: 0, max: 1, preset: 0.5 }),
        vsp: types.Number("Split.Vertical", { min: 0, max: 1, preset: 0.5 }),
    });

    outs = this.makeProps({
        cas: types.Vector2("Canvas.Size")
    });

    private _viewports: Viewport[];
    private _activeViewport: Viewport;

    constructor(id?: string)
    {
        super(id);

        this._viewports = [];
        this._activeViewport = null;
    }

    update()
    {
        const { lay, hsp, vsp } = this.ins;
        if (lay.changed) {
            this.setLayout(lay.value, hsp.value, vsp.value);
        }
        else {
            this.setSize(lay.value, hsp.value, vsp.value);
        }
    }

    forEachViewport(callback: (viewport: Viewport) => void)
    {
        this._viewports.forEach(viewport => callback(viewport));
    }

    setCanvasSize(width: number, height: number)
    {
        const cas = this.outs.cas;
        cas.value[0] = width;
        cas.value[1] = height;
        cas.push();

        this._viewports.forEach(viewport => viewport.setCanvasSize(width, height));
    }

    onPointer(event: IViewportPointerEvent)
    {
        const rect = (event.originalEvent.currentTarget as HTMLElement).getBoundingClientRect();
        const x = event.centerX - rect.left;
        const y = event.centerY - rect.top;

        if (event.isPrimary && event.type === "down") {
            this._activeViewport = this._viewports.find(viewport => viewport.isPointInside(x, y));
        }

        const viewport = event.viewport = this._activeViewport;
        if (viewport) {
            event.viewport.getDeviceCoords(x, y, _vec2);
            event.deviceX = _vec2.x;
            event.deviceY = _vec2.y;
        }

        if (event.isPrimary && event.type === "up") {
            this._activeViewport = null;
        }

        return super.onPointer(event);
    }

    onTrigger(event: IViewportTriggerEvent)
    {
        const rect = (event.originalEvent.currentTarget as HTMLElement).getBoundingClientRect();
        const x = event.centerX - rect.left;
        const y = event.centerY - rect.top;

        if (this._activeViewport) {
            event.viewport = this._activeViewport;
        }
        else {
            event.viewport = this._viewports.find(viewport => viewport.isPointInside(x, y));
        }

        if (event.viewport) {
            event.viewport.getDeviceCoords(x, y, _vec2);
            event.deviceX = _vec2.x;
            event.deviceY = _vec2.y;
        }

        return super.onTrigger(event);
    }

    protected setSize(layout: number, h: number, v: number)
    {
        const viewports = this._viewports;

        switch(layout) {
            case 1: // h-split
                viewports[0].set(0, 0, h, 1);
                viewports[1].set(h, 0, 1-h, 1);
                break;
            case 2: // v-split
                viewports[0].set(0, 0, 1, v);
                viewports[1].set(0, v, 1, 1-v);
                break;
            case 3: // quad
                viewports[0].set(0, 0, h, v);
                viewports[1].set(h, 0, 1-h, v);
                viewports[2].set(0, v, h, 1-v);
                viewports[3].set(h, v, 1-h, 1-v);
        }
    }

    protected setLayout(layout: number, h: number, v: number)
    {
        const viewports = this._viewports;

        switch(layout) {
            case 0:
                viewports.length = 1;
                viewports[0] = new Viewport(0, 0, 1, 1).setCamera("scene");
                break;

            case 1:
                viewports.length = 2;
                viewports[0] = new Viewport(0, 0, h, 1);
                viewports[1] = new Viewport(h, 0, 1-h, 1);
                break;

            case 2:
                viewports.length = 2;
                viewports[0] = new Viewport(0, 0, 1, v);
                viewports[1] = new Viewport(0, v, 1, 1-v);
                break;

            case 3:
                viewports.length = 4;
                viewports[0] = new Viewport(0, 0, h, v).setCamera("scene");
                viewports[1] = new Viewport(h, 0, 1-h, v).setCamera("viewport", "orthographic", "top");
                viewports[2] = new Viewport(0, v, h, 1-v).setCamera("viewport", "orthographic", "left");
                viewports[3] = new Viewport(h, v, 1-h, 1-v).setCamera("viewport", "orthographic", "front");
                break;
        }

        const size = this.outs.cas.value;
        viewports.forEach(viewport => viewport.setCanvasSize(size[0], size[1]));
    }
}