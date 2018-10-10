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

import { IManipEvent, IManipListener } from "@ff/react/Manip.old";

////////////////////////////////////////////////////////////////////////////////

export default class Scene implements IManipListener
{
    protected scene: THREE.Scene;
    protected camera: THREE.Camera;
    protected renderer: THREE.WebGLRenderer;

    protected loadingManager: THREE.LoadingManager;
    protected startTime: number;
    protected lastTime: number;
    protected isInitialized: boolean;

    constructor()
    {
        this.scene = new THREE.Scene();
        this.camera = null;

        this.startTime = Date.now() * 0.001;
        this.lastTime = 0;

        this.isInitialized = false;

        this.onLoadingStart = this.onLoadingStart.bind(this);
        this.onLoadingProgress = this.onLoadingProgress.bind(this);
        this.onLoadingCompleted = this.onLoadingCompleted.bind(this);
        this.onLoadingError = this.onLoadingError.bind(this);

        const manager = this.loadingManager = new THREE.LoadingManager();
        manager.onStart = this.onLoadingStart;
        manager.onProgress = this.onLoadingProgress;
        manager.onLoad = this.onLoadingCompleted;
        manager.onError = this.onLoadingError;
    }

    initialize(renderer: THREE.WebGLRenderer)
    {
        if (!this.isInitialized) {
            this.renderer = renderer;

            this.camera = this.setup(this.scene);
            this.isInitialized = true;
        }
    }

    render()
    {
        if (!this.isInitialized) {
            throw new Error("Scene.render - can't render, scene not initialized");
        }

        if (!this.camera) {
            throw new Error("Scene.render - can't render, camera not defined");
        }

        const time = Date.now() * 0.001 - this.startTime;
        this.update(time, time - this.lastTime);
        this.lastTime = time;

        this.renderer.render(this.scene, this.camera);
    }

    resize(width: number, height: number)
    {
        if (!this.camera) {
            return;
        }

        const aspect = width / height;

        if (this.camera.type === "PerspectiveCamera") {
            const camera = this.camera as THREE.PerspectiveCamera;
            camera.aspect = aspect;
            camera.updateProjectionMatrix();
        }
        else if (this.camera.type = "OrthographicCamera") {
            const camera = this.camera as THREE.OrthographicCamera;
            camera.left = camera.bottom * aspect;
            camera.right = camera.top * aspect;
            camera.updateProjectionMatrix();
        }
    }

    protected setup(scene: THREE.Scene): THREE.Camera
    {
        return new THREE.PerspectiveCamera(55, 1, 0.01, 100);
    }

    protected update(time: number, delta: number)
    {
    }

    onManipBegin(event: IManipEvent)
    {
    }

    onManipUpdate(event: IManipEvent)
    {
    }

    onManipEnd(event: IManipEvent)
    {
    }

    onManipEvent(event: IManipEvent)
    {
        return true;
    }

    protected onLoadingStart()
    {
        console.log("Loading files...");
    }

    protected onLoadingProgress(url, itemsLoaded, itemsTotal)
    {
        console.log(`Loaded ${itemsLoaded} of ${itemsTotal} files: ${url}`);
    }

    protected onLoadingCompleted()
    {
        console.log("Loading completed");
    }

    protected onLoadingError()
    {
        console.error(`Loading error`);
    }
}