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

import { Partial } from "@ff/core/types";
import { ComponentLink } from "@ff/core/ecs/Component";
import types from "@ff/core/ecs/propertyTypes";

import {
    IManipEventHandler,
    IManipPointerEvent,
    IManipTriggerEvent
} from "@ff/react/ManipTarget";

import Viewport, { IViewportPointerEvent, IViewportTriggerEvent } from "../three/Viewport";
import Manip from "./Manip";
import Controller from "./Controller";

////////////////////////////////////////////////////////////////////////////////

const _vec2 = new THREE.Vector2();

export { IViewportPointerEvent, IViewportTriggerEvent };

export default class ViewportController extends Controller implements IManipEventHandler
{
    static readonly type: string = "ViewportController";

    private static layout = [ "Single", "H-Split", "V-Split", "Quad" ];
    private static preset = [ "Left", "Right", "Top", "Bottom", "Front", "Back" ];
    private static camera = [ "Scene", "Preset" ];

    ins = this.makeProps({
        lay: types.Enum("Layout", ViewportController.layout, 3),
        hsp: types.Number("Split.Horizontal", { min: 0, max: 1, preset: 0.5 }),
        vsp: types.Number("Split.Vertical", { min: 0, max: 1, preset: 0.5 }),
    });

    outs = this.makeProps({
        cas: types.Vector2("Canvas.Size")
    });

    next: ComponentLink<Manip> = null;

    private viewports: Viewport[] = [];
    private activeViewport: Viewport = null;

    create()
    {
        this.next = new ComponentLink(this, Manip);
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
        this.viewports.forEach(viewport => callback(viewport));
    }

    setCanvasSize(width: number, height: number)
    {
        const cas = this.outs.cas;
        cas.value[0] = width;
        cas.value[1] = height;
        cas.push();

        this.viewports.forEach(viewport => viewport.setCanvasSize(width, height));
    }

    onPointer(event: IManipPointerEvent)
    {
        const vpEvent: Partial<IViewportPointerEvent> = event;

        const rect = (vpEvent.originalEvent.currentTarget as HTMLElement).getBoundingClientRect();
        const x = vpEvent.centerX - rect.left;
        const y = vpEvent.centerY - rect.top;

        vpEvent.viewport = this.viewports.find(viewport => viewport.isPointInside(x, y));

        if (vpEvent.viewport) {
            vpEvent.viewport.getDeviceCoords(x, y, _vec2);
            vpEvent.deviceX = _vec2.x;
            vpEvent.deviceY = _vec2.y;
        }
        else {
            vpEvent.deviceX = 0;
            vpEvent.deviceY = 0;
        }

        if (this.next.component) {
            return this.next.component.onPointer(vpEvent as IViewportPointerEvent);
        }

        return false;
    }

    onTrigger(event: IManipTriggerEvent)
    {
        const vpEvent: Partial<IViewportTriggerEvent> = event;

        const rect = (vpEvent.originalEvent.currentTarget as HTMLElement).getBoundingClientRect();
        const x = vpEvent.centerX - rect.left;
        const y = vpEvent.centerY - rect.top;

        vpEvent.viewport = this.viewports.find(viewport => viewport.isPointInside(x, y)) || null;

        if (vpEvent.viewport) {
            vpEvent.viewport.getDeviceCoords(x, y, _vec2);
            vpEvent.deviceX = _vec2.x;
            vpEvent.deviceY = _vec2.y;
        }
        else {
            vpEvent.deviceX = 0;
            vpEvent.deviceY = 0;
        }

        if (this.next.component) {
            return this.next.component.onTrigger(vpEvent as IViewportTriggerEvent);
        }

        return false;
    }

    protected setSize(layout: number, h: number, v: number)
    {
        const viewports = this.viewports;

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
        const viewports = this.viewports;

        switch(layout) {
            case 0:
                viewports.length = 1;
                viewports[0] = new Viewport(0, 0, 1, 1);
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
                viewports[0] = new Viewport(0, 0, h, v);
                viewports[1] = new Viewport(h, 0, 1-h, v).setCamera("orthographic", "top");
                viewports[2] = new Viewport(0, v, h, 1-v).setCamera("orthographic", "left");
                viewports[3] = new Viewport(h, v, 1-h, 1-v).setCamera("orthographic", "front");
                break;
        }

        const size = this.outs.cas.value;
        viewports.forEach(viewport => viewport.setCanvasSize(size[0], size[1]));
    }
}