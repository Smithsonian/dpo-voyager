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

import Performer, { IPerformerRenderEvent } from "@ff/core/ecs/Performer";
import ManipTarget from "@ff/browser/ManipTarget";

import QuadSplitter, { EViewportLayout } from "./QuadSplitter";

import Scene from "../../core/components/Scene";
import Camera from "../../core/components/Camera";
import QuadViewport from "../core/QuadViewport";

import CustomElement, { customElement, property } from "@ff/ui/CustomElement";

////////////////////////////////////////////////////////////////////////////////

export interface IRenderViewResizeEvent extends CustomEvent
{
    detail: {
        width: number;
        height: number;
    }
}

@customElement("sv-render-view")
export default class RenderView extends CustomElement
{
    static readonly resizeEvent: string = "sv-resize";

    @property({ attribute: false })
    performer: Performer;

    protected _manipTarget: ManipTarget;

    protected _canvas: HTMLCanvasElement = null;
    protected _overlay: HTMLDivElement = null;
    protected _splitter: QuadSplitter = null;
    protected _renderer: THREE.WebGLRenderer = null;
    protected _viewports: QuadViewport = null;

    constructor()
    {
        super();

        this.onResize = this.onResize.bind(this);

        this._manipTarget = new ManipTarget();

        this.addEventListener("pointerdown", this._manipTarget.onPointerDown);
        this.addEventListener("pointermove", this._manipTarget.onPointerMove);
        this.addEventListener("pointerup", this._manipTarget.onPointerUpOrCancel);
        this.addEventListener("pointercancel", this._manipTarget.onPointerUpOrCancel);
    }

    protected firstConnected()
    {
        this._canvas = this.createElement("canvas", {
            display: "block",
            width: "100%",
            height: "100%"
        }, this);

        this._overlay = this.createElement("div", {
            position: "absolute",
            top: "0", bottom: "0", left: "0", right: "0",
            overflow: "hidden"
        }, this);

        this._splitter = this.createElement(QuadSplitter, {
            position: "absolute",
            top: "0", bottom: "0", left: "0", right: "0",
            overflow: "hidden"
        }, this);

        this._renderer = new THREE.WebGLRenderer({
            canvas: this._canvas,
            antialias: true,
            devicePixelRatio: window.devicePixelRatio
        });

        this._viewports = new QuadViewport(this._renderer);
    }

    protected connected()
    {
        window.addEventListener("resize", this.onResize);
        this.performer.on("render", this.onPerformerRender, this);
    }

    protected disconnected()
    {
        this.performer.off("render", this.onPerformerRender, this);
        window.removeEventListener("resize", this.onResize);
    }

    protected onResize()
    {
        const width = this._canvas.clientWidth;
        const height = this._canvas.clientHeight;

        this._canvas.width = width;
        this._canvas.height = height;

        this._renderer.setSize(width, height, false);

        this.dispatchEvent(new CustomEvent(RenderView.resizeEvent, {
            detail: { width, height }
        } as IRenderViewResizeEvent));
    }

    protected onPerformerRender(event: IPerformerRenderEvent)
    {
        const system = event.system;
        const sceneComponent = system.getComponent(Scene);
        const cameraComponent = system.getComponent(Camera);

        if (!sceneComponent || !cameraComponent) {
            return;
        }

        const viewports = this._viewports;
        const renderer = this._renderer;

        renderer.clear();
        viewports.renderViewports(sceneComponent.scene, cameraComponent.camera);
    }
}