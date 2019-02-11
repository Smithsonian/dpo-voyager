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

import download from "@ff/browser/download";

import { IUpdateContext, types } from "@ff/graph/Component";

import CRenderGraph from "@ff/scene/components/CRenderGraph";

import { IPresentation } from "common/types/presentation";

import CVScene from "../../core/components/CVScene";
import CVPresentationData from "./CVPresentationData";
import NVPresentationScene, { ReferenceCallback } from "../nodes/NVPresentationScene";
import NVPresentationConfig from "../nodes/NVPresentationConfig";

////////////////////////////////////////////////////////////////////////////////

const _inputs = {
    activate: types.Event("Activate"),
    dump: types.Event("Dump"),
    download: types.Event("Download"),
};

/**
 * Graph containing a Voyager presentation.
 */
export default class CVPresentation extends CRenderGraph
{
    static readonly typeName: string = "CVPresentation";
    static readonly mimeType = "application/si-dpo-3d.presentation+json";

    ins = this.addInputs(_inputs);

    get presentation() {
        return this.innerGraph.components.get(CVPresentationData);
    }
    get scene() {
        return this.innerGraph.components.get(CVScene);
    }
    get setup() {
        return this.innerGraph.nodes.get(NVPresentationConfig);
    }

    setUrl(url: string, assetPath?: string, assetBaseName?: string)
    {
        this.presentation.setUrl(url, assetPath, assetBaseName);
        this.innerGraph.nodes.get(NVPresentationScene).setUrl(url, assetPath);
    }

    // get url() {
    //     return this.sceneNode.url;
    // }
    //
    // protected get sceneNode() {
    //     return this.innerGraph.nodes.get(NPresentationScene);
    // }

    create()
    {
        super.create();

        const graph = this.innerGraph;

        const main = graph.createNode("Main");
        main.createComponent(CVPresentationData);

        const scene = graph.createCustomNode(NVPresentationScene);
        scene.addChild(this.innerGraph.createCustomNode(NVPresentationConfig));
    }

    update(context: IUpdateContext)
    {
        const ins = this.ins;

        if (ins.activate.changed) {
            this.scene.ins.activate.set();
        }
        if (ins.dump.changed) {
            this.presentation.ins.dump.set();
        }
        if (ins.download.changed) {
            this.presentation.ins.download.set();
        }

        return true;
    }

    fromData(data: IPresentation, callback?: ReferenceCallback)
    {
        this.presentation.fromData(data, callback);
    }

    toData(writeReferences: boolean = false): IPresentation
    {
        return this.presentation.toData(writeReferences);
    }
}