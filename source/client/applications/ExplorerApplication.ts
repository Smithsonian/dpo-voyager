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

import coreTypes from "./coreTypes";
import explorerTypes from "./explorerTypes";

import * as documentTemplate from "common/templates/document.json";

import CVDocumentProvider from "../components/CVDocumentProvider";
import CVDocument from "../components/CVDocument";
import CVAssetReader from "../components/CVAssetReader";

import NVEngine from "../nodes/NVEngine";
import NVDocuments from "../nodes/NVDocuments";
import NVTools from "../nodes/NVTools";

import MainView from "../ui/explorer/MainView";

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

    protected get assetReader() {
        return this.system.getMainComponent(CVAssetReader);
    }
    protected get documentProvider() {
        return this.system.getMainComponent(CVDocumentProvider);
    }

    constructor(parent: HTMLElement, props?: IExplorerApplicationProps, embedded?: boolean)
    {
        this.props = props;
        console.log(ExplorerApplication.splashMessage);

        // register components
        const registry = new TypeRegistry();

        registry.add(coreTypes);
        registry.add(explorerTypes);

        this.commander = new Commander();
        const system = this.system = new System(registry);

        const engine = system.graph.createCustomNode(NVEngine);
        system.graph.createCustomNode(NVTools);
        system.graph.createCustomNode(NVDocuments);

        if (parent) {
            // create a view and attach to parent
            new MainView(this).appendTo(parent);
        }

        if (!embedded) {
            // initialize default document
            this.documentProvider.createDocument(documentTemplate as any);
            this.evaluateProps();
        }

        // start rendering
        engine.pulse.start();
    }

    setRootUrl(url: string)
    {
        this.assetReader.setRootURL(url);
    }

    loadDocument(documentPath: string, merge?: boolean): Promise<CVDocument>
    {
        return this.assetReader.getJSON(documentPath)
            .then(data => {
                merge = merge === undefined ? !data.lights && !data.cameras : merge;
                return this.documentProvider.amendDocument(data, documentPath, merge);
            })
            .catch(error => {
                console.warn(`error while loading document: ${error.message}`);
                throw error;
            });
    }

    loadModel(modelPath: string, quality: string)
    {
        return this.documentProvider.appendModel(modelPath, quality);
    }

    loadGeometry(geoPath: string, colorMapPath?: string,
                 occlusionMapPath?: string, normalMapPath?: string, quality?: string)
    {
        return this.documentProvider.appendGeometry(
            geoPath, colorMapPath, occlusionMapPath, normalMapPath, quality);
    }


    evaluateProps()
    {
        const props = this.props;
        const reader = this.assetReader;

        props.root = props.root || parseUrlParameter("root") || parseUrlParameter("r");
        props.document = props.document || parseUrlParameter("document") || parseUrlParameter("d");
        props.model = props.model || parseUrlParameter("model") || parseUrlParameter("m");
        props.geometry = props.geometry || parseUrlParameter("geometry") || parseUrlParameter("g");
        props.texture = props.texture || parseUrlParameter("texture") || parseUrlParameter("t");
        props.quality = props.quality || parseUrlParameter("quality") || parseUrlParameter("q");

        this.setRootUrl(props.root || props.document || props.model || props.geometry || "");

        if (props.document) {
            props.document = props.root ? props.document : reader.getAssetFileName(props.document);
            this.loadDocument(props.document);
        }
        if (props.model) {
            props.model = props.root ? props.model : reader.getAssetFileName(props.model);
            this.loadModel(props.model, props.quality);
        }
        else if (props.geometry) {
            props.geometry = props.root ? props.geometry : reader.getAssetFileName(props.geometry);
            props.texture = props.root ? props.texture : reader.getAssetFileName(props.texture);
            this.loadGeometry(props.geometry, props.texture, null, null, props.quality);
        }
    }
}

window["resolvePathname"] = resolvePathname;
window["VoyagerExplorer"] = ExplorerApplication;