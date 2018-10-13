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
import parseUrlParameter from "@ff/browser/parseUrlParameter";

import Controller, { Actions } from "@ff/core/Controller";
import Commander from "@ff/core/Commander";
import { IManipEventHandler, IManipPointerEvent, IManipTriggerEvent } from "@ff/react/ManipTarget";

import PresentationSystem from "../system/PresentationSystem";
import PresentationLoader from "../loaders/PresentationLoader";
import PresentationView from "../views/PresentationView";

////////////////////////////////////////////////////////////////////////////////

export type RenderMode = "standard" | "clay" | "normals" | "wireframe" | "x-ray";
export type ProjectionMode = "perspective" | "orthographic";

export type PresentationActions = Actions<PresentationController>;

export default class PresentationController extends Controller<PresentationController> implements IManipEventHandler
{
    public readonly actions: PresentationActions;

    protected system: PresentationSystem;
    protected views: PresentationView[];
    protected presentationLoader: PresentationLoader;
    protected animHandler: number;


    constructor(commander: Commander, system: PresentationSystem)
    {
        super(commander);

        this.system = system;
        this.views = [];

        const loadingManager = system.loadingManager;
        this.presentationLoader = new PresentationLoader(loadingManager);
        this.animHandler = 0;

        this.onAnimationFrame = this.onAnimationFrame.bind(this);
        this.onLoadingStart = this.onLoadingStart.bind(this);
        this.onLoadingProgress = this.onLoadingProgress.bind(this);
        this.onLoadingCompleted = this.onLoadingCompleted.bind(this);
        this.onLoadingError = this.onLoadingError.bind(this);

        loadingManager.onStart = this.onLoadingStart;
        loadingManager.onProgress = this.onLoadingProgress;
        loadingManager.onLoad = this.onLoadingCompleted;
        loadingManager.onError = this.onLoadingError;
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

    startRendering()
    {
        if (this.animHandler === 0) {
            this.animHandler = window.requestAnimationFrame(this.onAnimationFrame);
        }
    }

    stopRendering()
    {
        if (this.animHandler !== 0) {
            window.cancelAnimationFrame(this.animHandler);
            this.animHandler = 0;
        }
    }

    renderFrame()
    {
        this.views.forEach(view => {
            this.system.renderLayout(view.renderer, view.container);
        });
    }

    setCanvasSize(width: number, height: number)
    {
        this.system.setCanvasSize(width, height);
    }

    startup()
    {
        const item = parseUrlParameter("item");
        const presentation = parseUrlParameter("presentation");

        if (item) {
            this.loadItem(item, presentation);
        }
        else if (presentation) {
            this.loadPresentation(presentation);
        }
    }

    loadItem(itemUrl: string, templateUrl?: string)
    {
        // TODO: Implement
    }

    loadPresentation(url: string)
    {
        const system = this.system;

        this.presentationLoader.load(url)
            .then(presentationData => {
                system.openPresentation(presentationData, resolvePathname(".", url));
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

    setViewPreset(index: number, preset: string)
    {
    }

    setState(state)
    {

    }

    addView(view: PresentationView)
    {
        this.views.push(view);
    }

    removeView(view: PresentationView)
    {
        const index = this.views.indexOf(view);
        if (index >= 0) {
            this.views.splice(index, 1);
        }
    }

    onPointer(event: IManipPointerEvent)
    {
        return this.system.onPointer(event);
    }

    onTrigger(event: IManipTriggerEvent)
    {
        return this.system.onTrigger(event);
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