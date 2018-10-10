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

////////////////////////////////////////////////////////////////////////////////

/**
 * Emitted by [[Viewport]] after the instance's state has changed.
 */
export interface IViewportChangeEvent extends IPublisherEvent<Viewport> { }

export default class Viewport extends Publisher<Viewport>
{
    protected isRelative: boolean;

    protected _x: number;
    protected _y: number;
    protected _width: number;
    protected _height: number;

    protected vpX: number;
    protected vpY: number;
    protected vpWidth: number;
    protected vpHeight: number;

    protected canvasWidth: number;
    protected canvasHeight: number;


    constructor()
    {
        super();
        this.addEvent("change");

        this.isRelative = true;

        this.canvasWidth = 100;
        this.canvasHeight = 100;
        this.setViewportSize(0, 0, 1, 1);
    }

    get x()
    {
        return this.vpX;
    }

    get y()
    {
        return this.vpY;
    }

    get width()
    {
        return this.vpWidth;
    }

    get height()
    {
        return this.vpHeight;
    }

    apply(renderer: THREE.WebGLRenderer)
    {
        renderer.setViewport(this.vpX, this.vpY, this.vpWidth, this.vpHeight);
    }

    setRelative(isRelative: boolean)
    {
        this.isRelative = isRelative;
    }

    setViewportSize(x: number, y: number, width: number, height: number)
    {
        this._x = x;
        this._y = y;
        this._width = width;
        this._height = height;

        if (this.isRelative) {
            this.vpX = x * this.canvasWidth;
            this.vpY = y * this.canvasHeight;
            this.vpWidth = width * this.canvasWidth;
            this.vpHeight = height * this.canvasHeight;
        }
        else {
            this.vpX = x;
            this.vpY = y;
            this.vpWidth = width;
            this.vpHeight = height;
        }

        this.emit("change");
    }

    setCanvasSize(canvasWidth: number, canvasHeight: number)
    {
        this.canvasWidth = canvasWidth;
        this.canvasHeight = canvasHeight;

        this.setViewportSize(this._x, this._y, this._width, this._height);
    }
}