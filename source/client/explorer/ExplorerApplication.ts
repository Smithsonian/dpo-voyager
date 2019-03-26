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

import { componentTypes as graphComponents } from "@ff/graph/components";
import { componentTypes as sceneComponents } from "@ff/scene/components";
import { componentTypes as explorerComponents } from "./components";

import { nodeTypes as graphNodes } from "@ff/graph/nodes";
import { nodeTypes as sceneNodes } from "@ff/scene/nodes";
import { nodeTypes as explorerNodes } from "./nodes";

import { IDocument } from "common/types/document";

import CVDocument from "./components/CVDocument";
import CVDocumentLoader from "./components/CVDocumentLoader";
import CVAssetLoader from "./components/CVAssetLoader";

import NVEngine from "./nodes/NVEngine";
import NVExplorer from "./nodes/NVExplorer";
import NVDocuments from "./nodes/NVDocuments";
import NVTools from "./nodes/NVTools";

import MainView from "./ui/MainView";

////////////////////////////////////////////////////////////////////////////////

/**
 * Initial properties of the Voyager Explorer main [[ExplorerApplication]].
 */
export interface IExplorerApplicationProps
{
    /** URL of the root asset folder. */
    root?: string;
    /** URL of the document to load and display at startup. */
    document?: string;
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

    protected get documentLoader() {
        return this.system.getMainComponent(CVDocumentLoader);
    }
    protected get assetLoader() {
        return this.system.getMainComponent(CVAssetLoader);
    }

    constructor(element?: HTMLElement, props?: IExplorerApplicationProps)
    {
        this.props = props;
        console.log(ExplorerApplication.splashMessage);

        // register components
        const registry = new TypeRegistry();

        registry.add(graphComponents);
        registry.add(sceneComponents);
        registry.add(explorerComponents);

        registry.add(graphNodes);
        registry.add(sceneNodes);
        registry.add(explorerNodes);

        this.commander = new Commander();
        const system = this.system = new System(registry);

        const engine = system.graph.createCustomNode(NVEngine);
        system.graph.createCustomNode(NVExplorer);
        system.graph.createCustomNode(NVTools);
        const documents = system.graph.createCustomNode(NVDocuments);

        // create default document
        this.documentLoader.openDefaultDocument().then(document => {
            documents.documentProvider.activeComponent = document;
        }).then(() => {
            // start loading from properties
            this.startup();
        });

        // create main view if not given
        if (element) {
            new MainView(this).appendTo(element);
        }

        // start rendering
        engine.pulse.start();
    }

    setRootUrl(url: string)
    {
        this.assetLoader.setRootURL(url);
    }

    loadDocument(documentOrUrl: string | IDocument): Promise<CVDocument | null>
    {
        return this.documentLoader.mergeDocument(documentOrUrl);
    }

    loadModel(modelUrl: string, quality: string): Promise<void>
    {
        return this.documentLoader.loadModel(modelUrl, quality);
    }

    loadGeometry(geoUrl: string, colorMapUrl?: string,
                 occlusionMapUrl?: string, normalMapUrl?: string, quality?: string): Promise<void>
    {
        return this.documentLoader.loadGeometry(geoUrl, colorMapUrl, occlusionMapUrl, normalMapUrl, quality);
    }


    protected startup()
    {
        const props = this.props;

        props.root = props.root || parseUrlParameter("root") || parseUrlParameter("r");
        props.document = props.document || parseUrlParameter("document") || parseUrlParameter("d");
        props.model = props.model || parseUrlParameter("model") || parseUrlParameter("m");
        props.geometry = props.geometry || parseUrlParameter("geometry") || parseUrlParameter("g");
        props.texture = props.texture || parseUrlParameter("texture") || parseUrlParameter("t");
        props.quality = props.quality || parseUrlParameter("quality") || parseUrlParameter("q");

        this.setRootUrl(props.root || props.document || props.model || props.geometry || "");

        if (props.document) {
            this.loadDocument(props.document);
        }
        if (props.model) {
            this.loadModel(props.model, props.quality);
        }
        else if (props.geometry) {
            this.loadGeometry(props.geometry, props.texture, null, null, props.quality);
        }

        return Promise.resolve();
    }
}

window["resolvePathname"] = resolvePathname;
window["VoyagerExplorer"] = ExplorerApplication;