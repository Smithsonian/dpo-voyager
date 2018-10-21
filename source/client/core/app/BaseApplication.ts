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

import parseUrlParameter from "@ff/browser/parseUrlParameter";

import { IPresentation, IItem } from "common/types";

import SystemController from "../components/SystemController";
import RenderController from "../components/RenderController";
import PresentationController from "../components/PresentationController";

import PickManip from "../components/PickManip";
import OrbitManip from "../components/OrbitManip";

import UpdateContext from "./UpdateContext";

import { registerComponents } from "./registerComponents";
import RenderSystem from "./RenderSystem";

import { EDerivativeQuality } from "./Derivative";

////////////////////////////////////////////////////////////////////////////////

/** Properties for [[VoyagerApplication]]. */
export interface IApplicationProps
{
    element: HTMLElement;
    presentation?: IPresentation;
    template?: IPresentation;
    item?: IItem;
    quality?: string;
    presentationUrl?: string;
    templateUrl?: string;
    itemUrl?: string;
    modelUrl?: string;
    geometryUrl?: string;
    textureUrl?: string;
}

export default class BaseApplication
{
    readonly system: RenderSystem;

    protected commander: Commander;
    protected registry: Registry;
    protected context: UpdateContext;
    protected main: Entity;

    protected systemController: SystemController;
    readonly renderController: RenderController;
    protected presentationController: PresentationController;

    protected pickManip: PickManip;
    protected orbitManip: OrbitManip;

    protected animHandler: number = 0;

    constructor()
    {
        console.log("3D Foundation Project");
        console.log("(c) 2018 Smithsonian Institution");
        console.log("https://3d.si.edu");

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

        // main entity
        this.main = this.system.createEntity("Main");

        this.systemController = this.main.createComponent(SystemController);
        this.systemController.createActions(this.commander);

        this.renderController = this.main.createComponent(RenderController);
        this.renderController.createActions(this.commander);

        this.presentationController = this.main.createComponent(PresentationController);
        this.presentationController.createActions(this.commander);

        this.pickManip = this.main.createComponent(PickManip);
        this.renderController.setNextManip(this.pickManip);

        this.orbitManip = this.main.createComponent(OrbitManip);
        this.pickManip.next.component = this.orbitManip;

        const loadingManager = this.presentationController.loaders.manager;
        loadingManager.onStart = this.onLoadingStart;
        loadingManager.onProgress = this.onLoadingProgress;
        loadingManager.onLoad = this.onLoadingCompleted;
        loadingManager.onError = this.onLoadingError;
    }

    loadItem(itemUrl, templatePath?: string)
    {
        this.presentationController.closeAll();
        this.presentationController.loadItem(itemUrl, templatePath);
    }

    loadPresentation(presentationUrl)
    {
        this.presentationController.closeAll();
        this.presentationController.loadPresentation(presentationUrl);
    }

    loadModel(modelUrl: string)
    {
        this.presentationController.closeAll();
        this.presentationController.loadModel(modelUrl);
    }

    loadGeometryAndTexture(geometryUrl: string, textureUrl?: string)
    {
        this.presentationController.closeAll();
        this.presentationController.loadGeometryAndTexture(geometryUrl, textureUrl);
    }

    protected parseArguments(props: IApplicationProps)
    {
        const presentationUrl = parseUrlParameter("presentation") || props.presentationUrl;
        const itemUrl = parseUrlParameter("item") || parseUrlParameter("i") || props.itemUrl;
        const templateUrl = parseUrlParameter("template") || parseUrlParameter("t") || props.templateUrl;
        const modelUrl = parseUrlParameter("model") || parseUrlParameter("m") || props.modelUrl;
        const geometryUrl = parseUrlParameter("geometry") || parseUrlParameter("g") || props.geometryUrl;
        const textureUrl = parseUrlParameter("texture") || parseUrlParameter("tex") || props.textureUrl;
        const qualityText = parseUrlParameter("quality") || parseUrlParameter("q") || props.quality;

        let quality = EDerivativeQuality[qualityText];
        quality = quality !== undefined ? quality : EDerivativeQuality.Medium;

        const controller = this.presentationController;

        if (presentationUrl) {
            console.log(`loading presentation from arguments url: ${presentationUrl}`);
            controller.loadPresentation(presentationUrl)
                .catch(error => console.error(error));
        }
        else if (itemUrl) {
            console.log(`loading item from arguments url: ${itemUrl}`);
            controller.loadItem(itemUrl, templateUrl)
                .catch(error => console.error(error));
        }
        else if (modelUrl) {
            console.log(`loading model from arguments url: ${modelUrl}`);
            controller.loadModel(modelUrl, quality)
                .catch(error => console.error(error));
        }
        else if (geometryUrl) {
            console.log(`loading geometry from arguments url: ${geometryUrl}`);
            controller.loadGeometryAndTexture(geometryUrl, textureUrl, quality)
                .catch(error => console.error(error));
        }
        else if (props.presentation) {
            console.log("parsing/opening presentation data from arguments...");
            controller.openPresentation(props.presentation)
            .catch(error => console.error(error));
        }
        else if (props.item) {
            console.log("parsing/opening item data from arguments...");
            controller.openItem(props.item)
            .catch(error => console.error(error));
        }
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

        const presentation = this.presentationController.activePresentation;
        if (!presentation) {
            return;
        }

        const scene = presentation.scene;
        const camera = presentation.camera;

        if (!scene || !camera) {
            return;
        }

        this.renderController.renderViews(scene, camera);
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