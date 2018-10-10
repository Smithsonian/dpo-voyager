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

import resolvePathname from "resolve-pathname";

import Controller, { Actions } from "@ff/core/Controller";
import Commander from "@ff/core/Commander";

import RenderSystem from "../system/RenderSystem";
import PresentationLoader from "../loaders/PresentationLoader";
import PresentationParser from "../loaders/PresentationParser";

import SceneComponent from "../components/Scene";
import CameraComponent from "../components/Camera";
import ModelComponent from "../components/Model";
import SelectionControllerComponent from "../components/SelectionController";
import OrbitControllerComponent from "../components/OrbitController";
import ManipHandler from "../system/ManipHandler";

import * as presentationTemplate from "../templates/presentation.json";
import { IPresentation } from "common/types/presentation";
import Transform from "../components/Transform";

////////////////////////////////////////////////////////////////////////////////

export type RenderMode = "standard" | "clay" | "normals" | "wireframe" | "x-ray";
export type ProjectionMode = "perspective" | "orthographic";
export type ViewPreset = "none" | "top" | "left" | "front" | "right" | "back" | "bottom";

export type PresentationActions = Actions<PresentationController>;

export default class PresentationController extends Controller<PresentationController>
{
    public readonly actions: PresentationActions;
    public readonly system: RenderSystem;
    public readonly handler: ManipHandler;

    protected presentationLoader: PresentationLoader;


    constructor(commander: Commander, system: RenderSystem)
    {
        super(commander);

        this.system = system;
        this.handler = new ManipHandler(system);
        this.presentationLoader = new PresentationLoader(system.loadingManager);

        this.onLoadingStart = this.onLoadingStart.bind(this);
        this.onLoadingProgress = this.onLoadingProgress.bind(this);
        this.onLoadingCompleted = this.onLoadingCompleted.bind(this);
        this.onLoadingError = this.onLoadingError.bind(this);

        system.loadingManager.onStart = this.onLoadingStart;
        system.loadingManager.onProgress = this.onLoadingProgress;
        system.loadingManager.onLoad = this.onLoadingCompleted;
        system.loadingManager.onError = this.onLoadingError;
    }

    createActions(commander: Commander)
    {
        return {
            load: commander.register({
                name: "Load Presentation", do: this.loadPresentation, target: this
            }),

            setRenderMode: commander.register({
                name: "Set Render Mode", do: this.setRenderMode, undo: this.setState, target: this
            }),
            setProjection: commander.register({
                name: "Set Projection", do: this.setProjection, undo: this.setState, target: this
            }),
            setViewPreset: commander.register({
                name: "Set View", do: this.setViewPreset, undo: this.setState, target: this
            })
        };
    }

    loadPresentation(url: string)
    {
        const system = this.system;
        this.system.context.assetPath = resolvePathname(".", url);

        this.presentationLoader.load(url)
            .then(presentationData => {
                PresentationParser.inflate(system, presentationData);
                PresentationParser.inflate(system, presentationTemplate as IPresentation, true);
                return this.system.waitForUpdate();
            })
            .then(() => {
                this.onPresentationReady();
                const models = system.getComponents(ModelComponent);
                models.forEach(model => model.load("medium"));
            })
            .catch(error => {
                console.warn("Failed to load presentation", error);
            });
    }

    setRenderMode(renderMode: RenderMode)
    {
    }

    setProjection(index: number, projection: ProjectionMode)
    {
    }

    setViewPreset(index: number, preset: ViewPreset)
    {
    }

    setState(state)
    {

    }

    protected onPresentationReady()
    {
        const system = this.system;

        const scene = system.getComponent(SceneComponent);
        const camera = system.getComponent(CameraComponent);

        const selectionController = scene.createComponent(SelectionControllerComponent);
        const orbitController = camera.createComponent(OrbitControllerComponent);
        selectionController.next.component = orbitController;

        // attach lights to orbit rotation
        const lights = system.findEntityByName("Lights");
        if (lights) {
            const transform = lights.getComponent(Transform);
            transform.in("Order").setValue(4);
            transform.in("Rotation").linkFrom(orbitController.out("Inverse.Orbit"));
        }

        this.handler.setManip(selectionController);
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