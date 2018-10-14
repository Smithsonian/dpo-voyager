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

import Commander from "@ff/core/Commander";
import Registry from "@ff/core/ecs/Registry";
import System, { Entity } from "@ff/core/ecs/System";

import PresentationController, {
    IPresentationChangeEvent,
    PresentationActions
} from "../controllers/PresentationController";
import UpdateContext from "./UpdateContext";

import { registerComponents } from "./registerComponents";
import ViewManager from "./ViewManager";

////////////////////////////////////////////////////////////////////////////////

/** Properties for [[VoyagerApplication]]. */
export interface IVoyagerApplicationProps
{
    element: HTMLElement;
}

export default class VoyagerApplication
{
    readonly presentationController: PresentationController;
    readonly presentationActions: PresentationActions;
    readonly viewManager: ViewManager;

    protected commander: Commander;
    protected registry: Registry;
    protected system: System;
    protected context: UpdateContext;
    protected main: Entity;
    protected loadingManager: THREE.LoadingManager;
    protected animHandler: number = 0;

    constructor(props: IVoyagerApplicationProps)
    {
        this.onAnimationFrame = this.onAnimationFrame.bind(this);
        this.onLoadingStart = this.onLoadingStart.bind(this);
        this.onLoadingProgress = this.onLoadingProgress.bind(this);
        this.onLoadingCompleted = this.onLoadingCompleted.bind(this);
        this.onLoadingError = this.onLoadingError.bind(this);

        this.commander = new Commander();

        this.registry = new Registry();
        registerComponents(this.registry);

        this.system = new System(this.registry);
        this.context = new UpdateContext();

        this.loadingManager = new THREE.LoadingManager();
        this.loadingManager.onStart = this.onLoadingStart;
        this.loadingManager.onProgress = this.onLoadingProgress;
        this.loadingManager.onLoad = this.onLoadingCompleted;
        this.loadingManager.onError = this.onLoadingError;

        this.viewManager = new ViewManager(this.system);

        // main entity
        this.main = this.system.createEntity("Main");
        this.presentationController = this.main.createComponent(PresentationController);
        this.presentationController.setLoadingManager(this.loadingManager);
        this.presentationController.on("change", this.onPresentationChange, this);
        this.presentationActions = this.presentationController.createActions(this.commander);
    }


    protected start()
    {
        if (this.animHandler === 0) {
            this.context.start();
            this.animHandler = window.requestAnimationFrame(this.onAnimationFrame);
        }
    }

    protected stop()
    {
        if (this.animHandler !== 0) {
            this.context.stop();
            window.cancelAnimationFrame(this.animHandler);
            this.animHandler = 0;
        }
    }

    protected renderFrame()
    {
        this.context.advance();

        this.system.update(this.context);
        this.system.tick(this.context);

        const pres = this.presentationController.getActivePresentation();
        if (!pres) {
            return;
        }

        const scene = pres.sceneComponent.scene;
        const camera = pres.cameraComponent.camera;

        if (!scene || !camera) {
            return;
        }

        this.viewManager.renderViews(scene, camera);
    }

    protected onPresentationChange(event: IPresentationChangeEvent)
    {
        if (event.presentation) {
            this.viewManager.setPresentationManip(event.presentation.manipComponent);
        }
    }

    protected onAnimationFrame()
    {
        this.renderFrame();
        this.animHandler = window.requestAnimationFrame(this.onAnimationFrame);
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