/**
 * 3D Foundation Project
 * Copyright 2019 Smithsonian Institution
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

import TypeRegistry from "@ff/core/TypeRegistry";

import System from "@ff/graph/System";

import coreTypes from "./coreTypes";
import miniTypes from "./miniTypes";

import * as documentTemplate from "common/templates/document.json";

import CVDocumentProvider from "../components/CVDocumentProvider";
import CVDocument from "../components/CVDocument";
import CVAssetReader from "../components/CVAssetReader";

import NVEngine from "../nodes/NVEngine";
import NVDocuments from "../nodes/NVDocuments";

import MainView from "../ui/mini/MainView";

////////////////////////////////////////////////////////////////////////////////

export interface IMiniApplicationProps
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
}

export default class MiniApplication
{
    protected static splashMessage = [
        "Voyager - 3D Explorer and Tool Suite",
        "3D Foundation Project",
        "(c) 2018 Smithsonian Institution",
        "https://3d.si.edu"
    ].join("\n");

    readonly props: IMiniApplicationProps;
    readonly system: System;

    protected get assetReader() {
        return this.system.getMainComponent(CVAssetReader);
    }
    protected get documentProvider() {
        return this.system.getMainComponent(CVDocumentProvider);
    }

    constructor(parent?: HTMLElement, props?: IMiniApplicationProps)
    {
        this.props = props;
        console.log(MiniApplication.splashMessage);

        // register components
        const registry = new TypeRegistry();

        registry.add(coreTypes);
        registry.add(miniTypes);

        const system = this.system = new System(registry);

        const engine = system.graph.createCustomNode(NVEngine);
        system.graph.createCustomNode(NVDocuments);

        if (parent) {
            // create a view and attach to parent
            new MainView(this).appendTo(parent);
        }

        this.documentProvider.createDocument(documentTemplate as any);
        this.evaluateProps();

        // start rendering
        engine.pulse.start();
    }

    setRootUrl(url: string)
    {
        this.assetReader.rootUrl = url;
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

        this.setRootUrl(props.root || props.document || props.model || props.geometry || "");

        if (props.document) {
            props.document = props.root ? props.document : reader.getAssetName(props.document);
            this.loadDocument(props.document);
        }
        if (props.model) {
            props.model = props.root ? props.model : reader.getAssetName(props.model);
            this.loadModel(props.model, "Medium");
        }
        else if (props.geometry) {
            props.geometry = props.root ? props.geometry : reader.getAssetName(props.geometry);
            props.texture = props.root ? props.texture : reader.getAssetName(props.texture);
            this.loadGeometry(props.geometry, props.texture, null, null, "Medium");
        }
    }
}

window["VoyagerMini"] = MiniApplication;