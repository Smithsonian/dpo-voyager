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

import TypeRegistry from "@ff/core/TypeRegistry";

import System from "@ff/graph/System";
import CPulse from "@ff/graph/components/CPulse";

import { componentTypes as graphComponents } from "@ff/graph/components";
import { componentTypes as sceneComponents } from "@ff/scene/components";
import { componentTypes as coreComponents } from "../core/components";

import { nodeTypes as graphNodes } from "@ff/graph/nodes";
import { nodeTypes as sceneNodes } from "@ff/scene/nodes";
import { nodeTypes as miniNodes } from "./nodes";

import CVAssetLoader from "../core/components/CVAssetLoader";

import NVMiniExplorer from "./nodes/NVMiniExplorer";

import MainView from "./ui/MainView";
import NVMiniItem from "./nodes/NVMiniItem";
import { EDerivativeQuality } from "../core/models/Derivative";

////////////////////////////////////////////////////////////////////////////////

export interface IMiniApplicationProps
{
    /** URL of the item to load and display at startup. */
    item?: string;
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

    protected get item() {
        return this.system.getMainNode(NVMiniItem);
    }

    constructor(element?: HTMLElement, props?: IMiniApplicationProps)
    {
        this.props = props;
        console.log(MiniApplication.splashMessage);

        // register components
        const registry = new TypeRegistry();

        registry.add(graphComponents);
        registry.add(sceneComponents);
        registry.add(coreComponents);

        registry.add(graphNodes);
        registry.add(sceneNodes);
        registry.add(miniNodes);

        const system = this.system = new System(registry);

        system.graph.createCustomNode(NVMiniExplorer, "Main");

        // create main view if not given
        if (element) {
            new MainView(this).appendTo(element);
        }

        // start rendering
        system.getComponent(CPulse).start();

        // start loading from properties
        this.startup();
    }

    loadItem(itemUrl: string)
    {
        this.item.loadItem(itemUrl);
    }

    loadModel(modelUrl: string)
    {
        this.item.loadModelAsset(EDerivativeQuality.Medium, modelUrl);
    }

    loadMesh(geoUrl: string, colorMapUrl?: string, occlusionMapUrl?: string, normalMapUrl?: string)
    {
        this.item.loadMeshAsset(EDerivativeQuality.Medium, geoUrl, colorMapUrl, occlusionMapUrl, normalMapUrl);
    }


    protected startup()
    {
        const props = this.props;

        props.item = props.item || parseUrlParameter("item") || parseUrlParameter("i");
        props.model = props.model || parseUrlParameter("model") || parseUrlParameter("m");
        props.geometry = props.geometry || parseUrlParameter("geometry") || parseUrlParameter("g");
        props.texture = props.texture || parseUrlParameter("texture") || parseUrlParameter("tex");

        const loaders = this.system.getMainComponent(CVAssetLoader);

        if (props.model) {
            this.loadModel(props.model);
        }
        else if (props.geometry) {
            this.loadMesh(props.geometry, props.texture);
        }
        else if (props.item) {
            this.loadItem(props.item);
        }

    }
}

window["VoyagerMini"] = MiniApplication;