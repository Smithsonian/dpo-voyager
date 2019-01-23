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

    ins = this.addInputs(ins);

    protected get setupNode() {
        return this.innerGraph.nodes.get(NPresentationSetup);
    }
    protected get sceneNode() {
        return this.innerGraph.nodes.get(NPresentationScene);
    }

    create()
    {
        super.create();

        const scene = this.innerGraph.createNode(NPresentationScene);
        scene.addChild(this.innerGraph.createNode(NPresentationSetup));
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
            this.setupNode.fromData(data.setup);
        }
    }

    toData(writeReferences: boolean = false)
    {
        const data = this.sceneNode.toData(writeReferences);
        data.setup = this.setupNode.toData();

        data.asset = {
            copyright: "Copyright Smithsonian Institution",
            generator: "Voyager Presentation Parser",
            version: "1.1"
        };

        return data as IPresentation;
    }
}