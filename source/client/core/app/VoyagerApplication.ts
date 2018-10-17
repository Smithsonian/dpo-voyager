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

import Commander from "@ff/core/Commander";
import Registry from "@ff/core/ecs/Registry";
import Entity from "@ff/core/ecs/Entity";

import PresentationController, {
    IPresentationChangeEvent
} from "../controllers/PresentationController";

import UpdateContext from "./UpdateContext";

import { registerComponents } from "./registerComponents";
import RenderSystem from "./RenderSystem";
import ViewManager from "./ViewManager";

import PickManip from "../components/PickManip";
import OrbitManip from "../components/OrbitManip";
import Loaders from "../loaders/Loaders";

////////////////////////////////////////////////////////////////////////////////

/** Properties for [[VoyagerApplication]]. */
export interface IVoyagerApplicationProps
{
    element: HTMLElement;
}

export default class VoyagerApplication
{
    readonly presentationController: PresentationController;
    readonly viewManager: ViewManager;

    protected commander: Commander;
    protected registry: Registry;
    protected system: RenderSystem;
    protected context: UpdateContext;
    protected loaders: Loaders;
    protected main: Entity;
    protected pickManip: PickManip;
    protected orbitManip: OrbitManip;
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

        this.system = new RenderSystem(this.registry);
        this.context = new UpdateContext();

        this.loaders = new Loaders();
        const manager = this.loaders.manager;

        manager.onStart = this.onLoadingStart;
        manager.onProgress = this.onLoadingProgress;
        manager.onLoad = this.onLoadingCompleted;
        manager.onError = this.onLoadingError;

        this.viewManager = new ViewManager(this.system);

        // main entity
        this.main = this.system.createEntity("Main");

        this.presentationController = new PresentationController(this.commander, this.system, this.loaders);
        this.presentationController.on("change", this.onPresentationChange, this);

        this.pickManip = this.main.createComponent(PickManip);
        this.viewManager.setNextManip(this.pickManip);

        this.orbitManip = this.main.createComponent(OrbitManip);
        this.pickManip.next.component = this.orbitManip;
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

        const scene = pres.scene;
        const camera = pres.camera;

        if (!scene || !camera) {
            return;
        }

        this.viewManager.renderViews(scene, camera);
    }

    protected onPresentationChange(event: IPresentationChangeEvent)
    {
        const current = event.current;
        const next = event.next;

        if (current) {
            this.pickManip.setRoot(null);

            // detach camera from orbit manip
            const cameraTransform = current.cameraTransform;
            if (cameraTransform) {
                cameraTransform.in("Matrix").unlinkFrom(this.orbitManip.out("Matrix"));
            }

            // detach light group from orbit manip
            const lightsTransform = current.lightsTransform;
            if (lightsTransform) {
                lightsTransform.in("Rotation").unlinkFrom(this.orbitManip.out("Inverse.Orbit"));
            }
        }

        if (next) {
            this.pickManip.setRoot(next.scene);

            // attach camera to orbit manip
            const cameraTransform = next.cameraTransform;
            if (cameraTransform) {
                this.orbitManip.setFromMatrix(cameraTransform.matrix);
                cameraTransform.in("Matrix").linkFrom(this.orbitManip.out("Matrix"));
            }

            // attach lights group to orbit manip
            const lightsTransform = next.lightsTransform;
            if (lightsTransform) {
                lightsTransform.in("Order").setValue(4);
                lightsTransform.in("Rotation").linkFrom(this.orbitManip.out("Inverse.Orbit"));
            }
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