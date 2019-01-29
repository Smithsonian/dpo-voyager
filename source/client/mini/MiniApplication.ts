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

import Registry from "@ff/graph/Registry";
import System from "@ff/graph/System";
import CPulse from "@ff/graph/components/CPulse";

import CRenderer from "@ff/scene/components/CRenderer";

import CVLoaders from "../core/components/CVLoaders";
import CVOrbitNavigation from "../core/components/CVOrbitNavigation";

import CMini from "./components/CMini";

import { componentTypes as graphComponents } from "@ff/graph/components";
import { componentTypes as sceneComponents } from "@ff/scene/components";
import { componentTypes as coreComponents } from "../core/components";
import { componentTypes as miniComponents } from "./components";

import MainView from "./ui/MainView";

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
    readonly commander: Commander;


    constructor(element?: HTMLElement, props?: IMiniApplicationProps)
    {
        console.log(MiniApplication.splashMessage);

        // register components
        const registry = new Registry();
        registry.registerComponentType(graphComponents);
        registry.registerComponentType(sceneComponents);
        registry.registerComponentType(coreComponents);
        registry.registerComponentType(miniComponents);

        this.commander = new Commander();
        const system = this.system = new System(registry);

        const node = system.graph.createNode("Mini");

        node.createComponent(CPulse);
        node.createComponent(CRenderer);

        node.createComponent(CVLoaders);
        node.createComponent(CVOrbitNavigation);

        node.createComponent(CMini).createActions(this.commander);

        // create main view if not given
        if (element) {
            new MainView(this).appendTo(element);
        }

        // start rendering
        node.components.get(CPulse).start();

        // start loading from properties
        this.props = this.initFromProps(props);
    }

    protected initFromProps(props: IMiniApplicationProps): IMiniApplicationProps
    {
        const miniController = this.system.components.get(CMini);

        props.item = props.item || parseUrlParameter("item") || parseUrlParameter("i");
        props.model = props.model || parseUrlParameter("model") || parseUrlParameter("m");
        props.geometry = props.geometry || parseUrlParameter("geometry") || parseUrlParameter("g");
        props.texture = props.texture || parseUrlParameter("texture") || parseUrlParameter("tex");

        if (props.item) {
            miniController.loadItem(props.item);
        }
        else if (props.model) {
            miniController.loadModel(props.model);
        }
        else if (props.geometry) {
            miniController.loadGeometryAndTexture(
                props.geometry, props.texture);
        }

        return props;
    }
}

window["VoyagerMini"] = MiniApplication;