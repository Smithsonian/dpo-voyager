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

import System from "@ff/core/ecs/System";
import Performer, { IPerformerRenderEvent } from "@ff/core/ecs/Performer";
import ManipTarget from "@ff/browser/ManipTarget";

import QuadSplitter, { EViewportLayout } from "./QuadSplitter";

import Renderer from "../../core/components/Renderer";
import Scene from "../../core/components/Scene";
import Camera from "../../core/components/Camera";
import PickManip from "../../core/components/PickManip";
import SystemController from "../../core/components/SystemController";
import QuadViewport from "../core/QuadViewport";

import CustomElement, { customElement } from "@ff/ui/CustomElement";

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

    protected system: System;
    protected controller: SystemController;
    protected performer: Performer;
    protected manipTarget: ManipTarget;

    protected canvas: HTMLCanvasElement = null;
    protected overlay: HTMLDivElement = null;
    protected splitter: QuadSplitter = null;
    protected renderer: THREE.WebGLRenderer = null;
    protected viewports: QuadViewport = null;

    constructor(system: System, performer: Performer)
    {
        super();

        this.onResize = this.onResize.bind(this);

        this.system = system;
        this.controller = system.getComponent(SystemController);
        this.performer = performer;
        this.manipTarget = new ManipTarget();

        this.addEventListener("pointerdown", this.manipTarget.onPointerDown);
        this.addEventListener("pointermove", this.manipTarget.onPointerMove);
        this.addEventListener("pointerup", this.manipTarget.onPointerUpOrCancel);
        this.addEventListener("pointercancel", this.manipTarget.onPointerUpOrCancel);
        this.addEventListener("wheel", this.manipTarget.onWheel);
    }

    protected firstConnected()
    {
        this.canvas = this.createElement("canvas", {
            display: "block",
            width: "100%",
            height: "100%"
        }, this);

        this.overlay = this.createElement("div", {
            position: "absolute",
            top: "0", bottom: "0", left: "0", right: "0",
            overflow: "hidden"
        }, this);

        this.splitter = new QuadSplitter().setStyle({
            position: "absolute",
            top: "0", bottom: "0", left: "0", right: "0",
            overflow: "hidden"
        }).appendTo(this);

        this.renderer = new THREE.WebGLRenderer({
            canvas: this.canvas,
            antialias: true,
            devicePixelRatio: window.devicePixelRatio
        });

        this.viewports = new QuadViewport(this.renderer);
    }

    protected connected()
    {
        window.addEventListener("resize", this.onResize);
        this.performer.on("render", this.onPerformerRender, this);

        this.manipTarget.onPointer = this.viewports.onPointer;
        this.manipTarget.onTrigger = this.viewports.onTrigger;
        this.viewports.next = this.system.getComponent(PickManip);

        this.controller.addInputListener(Renderer, "Viewport.Layout", this.onViewportLayout, this);
        this.controller.addInputListener(Renderer, "Viewport.HomeGrid", this.onViewportGrid, this);
        this.controller.addInputListener(Renderer, "Renderer.Exposure", this.onRendererExposure, this);
        this.controller.addInputListener(Renderer, "Renderer.Gamma", this.onRendererGamma, this);

        this.onResize();
    }

    protected disconnected()
    {
        this.performer.off("render", this.onPerformerRender, this);
        window.removeEventListener("resize", this.onResize);

        this.manipTarget.onPointer = null;
        this.manipTarget.onTrigger = null;
        this.viewports.next = null;

        this.controller.removeInputListener(Renderer, "Viewport.Layout", this.onViewportLayout, this);
        this.controller.removeInputListener(Renderer, "Viewport.HomeGrid", this.onViewportGrid, this);
        this.controller.removeInputListener(Renderer, "Renderer.Exposure", this.onRendererExposure, this);
        this.controller.removeInputListener(Renderer, "Renderer.Gamma", this.onRendererGamma, this);
    }

    protected onResize()
    {
        const width = this.canvas.clientWidth;
        const height = this.canvas.clientHeight;

        this.canvas.width = width;
        this.canvas.height = height;

        this.renderer.setSize(width, height, false);
        this.viewports.setCanvasSize(width, height);

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

        this.renderer.clear();
        this.renderer["overlay"] = this.overlay;
        this.viewports.renderViewports(sceneComponent.scene, cameraComponent.camera);
    }

    protected onViewportLayout(value: EViewportLayout)
    {
        this.viewports.layout = value;
    }

    protected onViewportGrid(value: boolean)
    {
        this.viewports.enableHomeGrid(value);
    }

    protected onRendererExposure(value: number)
    {
        this.renderer.toneMappingExposure = value;
    }

    protected onRendererGamma(value: number)
    {
        this.renderer.gammaFactor = value;
    }
}