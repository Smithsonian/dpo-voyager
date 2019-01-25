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

import { IUpdateContext, types } from "@ff/graph/Component";

import CRenderGraph from "@ff/scene/components/CRenderGraph";

import { IPresentation } from "common/types/presentation";

import CVoyagerScene from "../../core/components/CVoyagerScene";
import NPresentationScene, { ReferenceCallback } from "../nodes/NPresentationScene";
import NPresentationSetup from "../nodes/NPresentationSetup";

////////////////////////////////////////////////////////////////////////////////

const ins = {
    activate: types.Event("Activate")
};

/**
 * Graph containing a Voyager presentation.
 */
export default class CPresentation extends CRenderGraph
{
    static readonly type: string = "CPresentation";
    static readonly mimeType = "application/si-dpo-3d.presentation+json";

    ins = this.addInputs(ins);

    get scene() {
        return this.innerGraph.components.get(CVoyagerScene);
    }
    get setup() {
        return this.innerGraph.nodes.get(NPresentationSetup);
    }
    get url() {
        return this.sceneNode.url;
    }

    protected get sceneNode() {
        return this.innerGraph.nodes.get(NPresentationScene);
    }

    create()
    {
        super.create();

        const scene = this.innerGraph.createCustomNode(NPresentationScene);
        scene.addChild(this.innerGraph.createCustomNode(NPresentationSetup));
    }

    update(context: IUpdateContext)
    {
        const ins = this.ins;

        if (ins.activate.changed) {
            this.sceneNode.scene.ins.activate.set();
        }

        return true;
    }

    setUrl(url: string, assetPath?: string)
    {
        this.sceneNode.setUrl(url, assetPath);
    }

    fromData(data: IPresentation, callback?: ReferenceCallback)
    {
        this.sceneNode.fromData(data, callback);

        if (data.setup) {
            this.setup.fromData(data.setup);
        }
    }

    toData(writeReferences: boolean = false)
    {
        const data = this.sceneNode.toData(writeReferences);
        data.setup = this.setup.toData();


        data.info = {
            type: CPresentation.mimeType,
            copyright: "Copyright Smithsonian Institution",
            generator: "Voyager Presentation Parser",
            version: "1.2"
        };

        return data as IPresentation;
    }
}