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

import {
    Registry,
    Node
} from "@ff/graph";

import RenderSystem from "@ff/three/graph/RenderSystem";

import { IPresentation, IItem } from "common/types";

import { registerComponents as registerBaseComponents } from "@ff/three/graph/components";
import { registerComponents as registerCoreComponents } from "../core/app/registerComponents";

import Explorer from "../core/components/Explorer";
import Renderer from "../core/components/Renderer";
import Reader from "../core/components/Reader";

import SystemController from "../core/components/SystemController";
import PresentationController from "../core/components/PresentationController";
import AnnotationsController from "../core/components/AnnotationsController";
import ToursController from "../core/components/ToursController";

import PickManip from "../core/components/PickManip";
import OrbitManip from "../core/components/OrbitManip";

import { EDerivativeQuality } from "../core/app/Derivative";

import "./ExplorerView";

////////////////////////////////////////////////////////////////////////////////

export default class ExplorerApplication
{
    protected static splashMessage = [
        "Voyager Explorer",
        "3D Foundation Project",
        "(c) 2018 Smithsonian Institution",
        "https://3d.si.edu"
    ].join("\n");


    readonly system: RenderSystem;

    protected commander: Commander;
    protected registry: Registry;

    protected main: Node;

    protected explorer: Explorer;
    protected renderer: Renderer;
    protected reader: Reader;

    protected systemController: SystemController;
    protected presentationController: PresentationController;
    protected annotationsController: AnnotationsController;
    protected toursController: ToursController;

    protected pickManip: PickManip;
    protected orbitManip: OrbitManip;


    constructor()
    {
        console.log(ExplorerApplication.splashMessage);

        this.onLoadingStart = this.onLoadingStart.bind(this);
        this.onLoadingProgress = this.onLoadingProgress.bind(this);
        this.onLoadingCompleted = this.onLoadingCompleted.bind(this);
        this.onLoadingError = this.onLoadingError.bind(this);

        this.system = new RenderSystem();
        this.commander = new Commander();

        registerBaseComponents(this.system.registry);
        registerCoreComponents(this.system.registry);

        // main node
        this.main = this.system.graph.createNode("Main");

        this.explorer = this.main.createComponent(Explorer);
        this.renderer = this.main.createComponent(Renderer);
        this.reader = this.main.createComponent(Reader);

        this.systemController = this.main.createComponent(SystemController);
        this.systemController.createActions(this.commander);

        this.presentationController = this.main.createComponent(PresentationController);
        this.presentationController.createActions(this.commander);

        this.annotationsController = this.main.createComponent(AnnotationsController);
        this.annotationsController.createActions(this.commander);

        this.toursController = this.main.createComponent(ToursController);
        this.toursController.createActions(this.commander);

        const loadingManager = this.presentationController.loaders.manager;
        loadingManager.onStart = this.onLoadingStart;
        loadingManager.onProgress = this.onLoadingProgress;
        loadingManager.onLoad = this.onLoadingCompleted;
        loadingManager.onError = this.onLoadingError;

        this.system.start();
    }

    loadPresentation(url: string)
    {
        this.presentationController.closeAll();
        this.presentationController.loadPresentation(url);
    }

    loadItem(url: string, templatePath?: string)
    {
        this.presentationController.closeAll();
        this.presentationController.loadItem(url, templatePath);
    }

    loadModel(url: string)
    {
        this.presentationController.closeAll();
        this.presentationController.loadModel(url);
    }

    loadGeometry(geometryUrl: string, textureUrl?: string)
    {
        this.presentationController.closeAll();
        this.presentationController.loadGeometryAndTexture(geometryUrl, textureUrl);
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