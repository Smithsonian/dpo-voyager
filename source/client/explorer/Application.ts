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

/**
 * Initial properties of the Voyager Explorer main [[ExplorerApplication]].
 */
export interface IExplorerApplicationProps
{
    /** URL of the presentation to load and display at startup. */
    presentation?: string;
    /** If an item, model or geometry URL is given, optional URL of a presentation template to use with the item. */
    template?: string;
    /** URL of the item to load and display at startup. */
    item?: string;
    /** URL of a model (supported formats: gltf, glb) to load and display at startup. */
    model?: string;
    /** URL of a geometry (supported formats: obj, ply) to load and display at startup. */
    geometry?: string;
    /** If a geometry URL is given, optional URL of a color texture to use with the geometry. */
    texture?: string;
    /** When loading a model or geometry, the quality level to set for the asset.
        Valid options: "thumb", "low", "medium", "high". */
    quality?: string;
}

/**
 * Voyager Explorer main application.
 */
export default class ExplorerApplication
{
    protected static splashMessage = [
        "Voyager - 3D Explorer and Tool Suite",
        "3D Foundation Project",
        "(c) 2018 Smithsonian Institution",
        "https://3d.si.edu"
    ].join("\n");

    readonly props: IExplorerApplicationProps;
    readonly system: RenderSystem;
    readonly commander: Commander;
    readonly loadingManager: LoadingManager;

    readonly selectionController: SelectionController;
    readonly presentationController: PresentationController;

    constructor(element?: HTMLElement, props?: IExplorerApplicationProps)
    {
        console.log(ExplorerApplication.splashMessage);

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
        if (element) {
            new MainView(this).appendTo(element);
        }

        // create main node and components
        this.system.graph.createNode(Explorer);

        // start rendering
        this.system.start();

        // start loading from properties
        this.props = this.initFromProps(props);
    }

    protected initFromProps(props: IExplorerApplicationProps): IExplorerApplicationProps
    {
        props.presentation = props.presentation || parseUrlParameter("presentation") || parseUrlParameter("p");
        props.item = props.item || parseUrlParameter("item") || parseUrlParameter("i");
        props.template = props.template || parseUrlParameter("template") || parseUrlParameter("t");
        props.model = props.model || parseUrlParameter("model") || parseUrlParameter("m");
        props.geometry = props.geometry || parseUrlParameter("geometry") || parseUrlParameter("g");
        props.texture = props.texture || parseUrlParameter("texture") || parseUrlParameter("tex");
        props.quality = props.quality || parseUrlParameter("quality") || parseUrlParameter("q");

        if (props.presentation) {
            this.presentationController.loadPresentation(props.presentation);
        }
        else if (props.item) {
            this.presentationController.loadItem(props.item, props.template);
        }
        else if (props.model) {
            this.presentationController.loadModel(props.model, props.quality, props.template);
        }
        else if (props.geometry) {
            this.presentationController.loadGeometryAndTexture(
                props.geometry, props.texture, props.quality, props.template);
        }

        return props;
    }
}

window["VoyagerExplorer"] = ExplorerApplication;