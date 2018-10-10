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

import Viewport from "../three/Viewport";
import AssetLoader from "../loaders/AssetLoader";

import SceneComponent from "../components/Scene";
import MainCameraComponent from "../components/MainCamera";

import RenderContext from "./RenderContext";

////////////////////////////////////////////////////////////////////////////////

export default class RenderSystem extends System
{
    readonly context: RenderContext;
    readonly loadingManager: THREE.LoadingManager;

    protected renderer: THREE.WebGLRenderer;
    protected animHandler: number;
    protected viewport: Viewport;

    constructor()
    {
        super();

        this.onAnimationFrame = this.onAnimationFrame.bind(this);

        this.loadingManager = new THREE.LoadingManager();
        this.renderer = null;
        this.animHandler = 0;
        this.viewport = new Viewport();

        this.context = new RenderContext();
        this.context.viewport = this.viewport;
        this.context.assetLoader = new AssetLoader(this.loadingManager);
    }

    start()
    {
        this.context.start();

        if (this.animHandler === 0) {
            this.animHandler = window.requestAnimationFrame(this.onAnimationFrame);
        }
    }

    stop()
    {
        this.context.stop();

        if (this.animHandler !== 0) {
            window.cancelAnimationFrame(this.animHandler);
            this.animHandler = 0;
        }
    }

    render()
    {
        this.context.advance();

        this.update();
        this.tick();

        const sceneComponent = this.getComponent(SceneComponent);
        const mainCameraComponent = this.getComponent(MainCameraComponent);
        const mainCamera = mainCameraComponent && mainCameraComponent.activeCamera;

        //const red = Math.sin(this.context.secondsElapsed) * 0.5 + 0.5;
        //this.renderer.setClearColor(new THREE.Color(red, 0.2, 1-red));
        this.renderer.clear();

        if (sceneComponent && mainCamera) {
            this.renderer.render(sceneComponent.scene, mainCamera);
        }
    }

    setCanvas(canvas: HTMLCanvasElement)
    {
        if (this.renderer) {
            this.renderer.dispose();
            this.renderer = null;
        }

        if (canvas) {
            this.renderer = new THREE.WebGLRenderer({
                canvas,
                antialias: true
            });

            //this.renderer.setClearColor("#0f3242");

            this.start();
        }
        else {
            this.stop();
        }
    }

    setViewportSize(width: number, height: number)
    {
        this.context.viewport.setCanvasSize(width, height);
        this.renderer.setSize(width, height, false);
    }

    protected onAnimationFrame()
    {
        if (this.renderer) {
            this.render();
        }

        this.animHandler = window.requestAnimationFrame(this.onAnimationFrame);
    }
}