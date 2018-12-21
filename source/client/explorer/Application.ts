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

import parseUrlParameter from "@ff/browser/parseUrlParameter";

import Commander from "@ff/core/Commander";
import LoadingManager from "@ff/three/LoadingManager";
import RenderSystem from "@ff/scene/RenderSystem";

import SelectionController from "@ff/scene/SelectionController";
import PresentationController from "./controllers/PresentationController";

import { componentTypes as sceneComponents } from "@ff/scene/components";
import { componentTypes as explorerComponents } from "./components";

import Explorer from "./nodes/Explorer";

import MainView from "./ui/MainView";

////////////////////////////////////////////////////////////////////////////////

export interface IApplicationProps
{
    parseUrl?: boolean;
    item?: string;
    presentation?: string;
    template?: string;
    model?: string;
    geometry?: string;
    texture?: string;
}

export default class Application
{
    protected static splashMessage = [
        "Voyager - 3D Explorer and Tool Suite!!",
        "3D Foundation Project",
        "(c) 2018 Smithsonian Institution",
        "https://3d.si.edu"
    ].join("\n");

    readonly system: RenderSystem;
    readonly commander: Commander;
    readonly loadingManager: LoadingManager;

    readonly selectionController: SelectionController;
    readonly presentationController: PresentationController;

    constructor(props?: IApplicationProps, createView?: boolean)
    {
        console.log(Application.splashMessage);

        this.system = new RenderSystem();
        this.commander = new Commander();
        this.loadingManager = new LoadingManager();

        this.selectionController = new SelectionController(this.system, this.commander);
        this.presentationController = new PresentationController(this.system, this.commander);

        // register components
        const registry = this.system.registry;
        registry.registerComponentType(sceneComponents);
        registry.registerComponentType(explorerComponents);

        // create main view if not given
        if (createView !== false) {
            new MainView(this).appendTo(document.body);
        }

        // create main node and components
        this.system.graph.createNode(Explorer);

        // start rendering
        this.system.start();

        // start loading from properties
        this.initFromProps(props || {});
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

    protected initFromProps(props: IApplicationProps)
    {
        let { item, presentation, template, model, geometry, texture } = props;

        if (!item && !presentation && !template && !model && !geometry && !texture) {
            presentation = parseUrlParameter("presentation") || parseUrlParameter("p");
            item = parseUrlParameter("item") || parseUrlParameter("i");
            template = parseUrlParameter("template") || parseUrlParameter("t");
            model = parseUrlParameter("model") || parseUrlParameter("m");
            geometry = parseUrlParameter("geometry") || parseUrlParameter("g");
            texture = parseUrlParameter("texture") || parseUrlParameter("tex");
        }

        if (presentation) {
            this.loadPresentation(presentation);
        }
        else if (item) {
            this.loadItem(item, template);
        }
        else if (model) {
            this.loadModel(model);
        }
        else if (geometry) {
            this.loadGeometry(geometry, texture);
        }
    }
}

window["VoyagerExplorer"] = Application;