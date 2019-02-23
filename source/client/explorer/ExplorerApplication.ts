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
import TypeRegistry from "@ff/core/TypeRegistry";

import System from "@ff/graph/System";
import CPulse from "@ff/graph/components/CPulse";

import { componentTypes as graphComponents } from "@ff/graph/components";
import { componentTypes as sceneComponents } from "@ff/scene/components";
import { componentTypes as coreComponents } from "../core/components";
import { componentTypes as explorerComponents } from "./components";

import { nodeTypes as graphNodes } from "@ff/graph/nodes";
import { nodeTypes as sceneNodes } from "@ff/scene/nodes";
import { nodeTypes as explorerNodes } from "./nodes";

import { IPresentation } from "common/types/presentation";
import { IItem } from "common/types/item";

import * as presentationTemplate from "common/templates/presentation.json";

import CVLoaders from "../core/components/CVLoaders";
import NVExplorer from "./nodes/NVExplorer";
import NVDocuments from "./nodes/NVDocuments";
import CVDocument from "./components/CVDocument";
import NVItem from "./nodes/NVItem";

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
    /** Base url to use for new items or assets. */
    base?: string;
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
    readonly system: System;
    readonly commander: Commander;


    constructor(element?: HTMLElement, props?: IExplorerApplicationProps)
    {
        this.props = props;
        console.log(ExplorerApplication.splashMessage);

        // register components
        const registry = new TypeRegistry();

        registry.add(graphComponents);
        registry.add(sceneComponents);
        registry.add(coreComponents);
        registry.add(explorerComponents);

        registry.add(graphNodes);
        registry.add(sceneNodes);
        registry.add(explorerNodes);

        this.commander = new Commander();
        const system = this.system = new System(registry);

        const main = system.graph.createCustomNode(NVExplorer, "Main");
        system.graph.createCustomNode(NVDocuments, "Documents");

        // create main view if not given
        if (element) {
            new MainView(this).appendTo(element);
        }

        // start rendering
        main.getComponent(CPulse).start();

        // start loading from properties
        this.startup();
    }

    openDocument(documentOrUrl: string | object): Promise<CVDocument | null>
    {
        const loaders = this.system.getMainComponent(CVLoaders);
        const documents = this.system.getMainNode(NVDocuments);

        const getDocument = typeof documentOrUrl === "string" ?
            loaders.loadJSON(documentOrUrl) : Promise.resolve(documentOrUrl);

        return getDocument.then(jsonData => {
            const document = documents.createComponent(CVDocument);
            document.inflate(jsonData);
            document.inflateReferences(jsonData);
            return document;
        }).catch(error => {
            console.warn("Failed to open document", error);
            return null;
        });
    }

    openPresentation(presentationOrUrl: string | IPresentation): Promise<CVDocument | null>
    {
        const loaders = this.system.getMainComponent(CVLoaders);
        const documents = this.system.getMainNode(NVDocuments);

        const url = typeof presentationOrUrl === "string" ? presentationOrUrl : "";
        const getPresentation = url ? loaders.loadPresentation(url) : Promise.resolve(presentationOrUrl as IPresentation);

        return getPresentation.then(presentationData => {
            const document = documents.createComponent(CVDocument);
            document.url = url;
            document.fromPresentation(presentationData);
            return document;
        }).catch(error => {
            console.warn("Failed to open presentation", error);
            return null;
        });
    }

    openDefaultPresentation(): Promise<CVDocument>
    {
        return this.openPresentation(presentationTemplate as IPresentation);
    }

    openItem(itemOrUrl: string | IItem): Promise<NVItem | null>
    {
        const loaders = this.system.getMainComponent(CVLoaders);
        const documents = this.system.getMainNode(NVDocuments);

        const url = typeof itemOrUrl === "string" ? itemOrUrl : "";
        const getItem = url ? loaders.loadItem(url) : Promise.resolve(itemOrUrl as IItem);

        let itemData;

        return getItem.then(data => {
            itemData = data;
            return documents.documentManager.activeDocument as CVDocument ||
                this.openPresentation(presentationTemplate as IPresentation);
        }).then(document => {
            const item = document.createItem();
            item.url = url;
            item.fromData(itemData);
            return item;
        }).catch(error => {
            console.warn("Failed to open item", error);
            return null;
        });
    }

    protected startup()
    {
        const props = this.props;

        props.presentation = props.presentation || parseUrlParameter("presentation") || parseUrlParameter("p");
        props.item = props.item || parseUrlParameter("item") || parseUrlParameter("i");
        props.template = props.template || parseUrlParameter("template") || parseUrlParameter("t");
        props.model = props.model || parseUrlParameter("model") || parseUrlParameter("m");
        props.geometry = props.geometry || parseUrlParameter("geometry") || parseUrlParameter("g");
        props.texture = props.texture || parseUrlParameter("texture") || parseUrlParameter("tex");
        props.quality = props.quality || parseUrlParameter("quality") || parseUrlParameter("q");
        props.base = props.base || parseUrlParameter("base") || parseUrlParameter("b");


        if (props.presentation) {
            this.openPresentation(props.presentation);
        }
        if (props.item) {
            this.openItem(props.item);
        }
        // if (props.model) {
        //     return controller.loadModel(props.model, props.quality, props.template, props.base);
        // }
        // if (props.geometry) {
        //     return controller.loadGeometryAndTexture(
        //         props.geometry, props.texture, props.quality, props.template, props.base);
        // }

        return Promise.resolve();
    }
}

window["VoyagerExplorer"] = ExplorerApplication;