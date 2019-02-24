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

import CVDocument from "./components/CVDocument";
import CVDocumentLoader from "./components/CVDocumentLoader";

import NVExplorer from "./nodes/NVExplorer";
import NVDocuments from "./nodes/NVDocuments";
import NVItem from "./nodes/NVItem";

import MainView from "./ui/MainView";

////////////////////////////////////////////////////////////////////////////////

/**
 * Initial properties of the Voyager Explorer main [[ExplorerApplication]].
 */
export interface IExplorerApplicationProps
{
    /** URL of the document to load and display at startup. */
    document?: string;
    /** URL of the presentation to load and display at startup. */
    presentation?: string;
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
    readonly system: System;
    readonly commander: Commander;

    protected get loader() {
        return this.system.getMainComponent(CVDocumentLoader);
    }

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

    loadDocument(documentOrUrl: string | object): Promise<CVDocument | null>
    {
        return this.loader.loadDocument(documentOrUrl);
    }

    loadPresentation(presentationOrUrl: string | IPresentation): Promise<CVDocument | null>
    {
        return this.loader.loadPresentation(presentationOrUrl);
    }

    loadDefaultPresentation(): Promise<CVDocument>
    {
        return this.loader.loadDefaultPresentation();
    }

    loadItem(itemOrUrl: string | IItem): Promise<NVItem | null>
    {
        return this.loader.loadItem(itemOrUrl);
    }

    loadModel(modelUrl: string): Promise<NVItem | null>
    {
        return this.loader.createItemWithModelAsset(modelUrl);
    }

    loadMesh(geoUrl: string, colorMapUrl?: string, occlusionMapUrl?: string, normalMapUrl?: string): Promise<NVItem | null>
    {
        return this.loader.createItemFromGeometryAndMaps(geoUrl, colorMapUrl, occlusionMapUrl, normalMapUrl);
    }

    protected startup()
    {
        const props = this.props;

        props.document = props.document || parseUrlParameter("document") || parseUrlParameter("d");
        props.presentation = props.presentation || parseUrlParameter("presentation") || parseUrlParameter("p");
        props.item = props.item || parseUrlParameter("item") || parseUrlParameter("i");
        props.model = props.model || parseUrlParameter("model") || parseUrlParameter("m");
        props.geometry = props.geometry || parseUrlParameter("geometry") || parseUrlParameter("g");
        props.texture = props.texture || parseUrlParameter("texture") || parseUrlParameter("tex");
        props.quality = props.quality || parseUrlParameter("quality") || parseUrlParameter("q");

        if (props.document) {
            this.loader.loadDocument(props.document);
        }
        if (props.presentation) {
            this.loader.loadPresentation(props.presentation);
        }
        if (props.model) {
            this.loader.createItemWithModelAsset(props.model, props.item, props.quality);
        }
        else if (props.geometry) {
            this.loader.createItemFromGeometryAndMaps(props.geometry, props.texture, null, null, props.item, props.quality);
        }
        else if (props.item) {
            this.loader.loadItem(props.item);
        }

        return Promise.resolve();
    }
}

window["VoyagerExplorer"] = ExplorerApplication;