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
import download from "@ff/browser/download";

import Component, { types } from "@ff/graph/Component";

import { IPresentation } from "common/types/presentation";

import NVPresentationScene, { ReferenceCallback } from "../nodes/NVPresentationScene";
import NVPresentationConfig from "../nodes/NVPresentationConfig";

////////////////////////////////////////////////////////////////////////////////

const _inputs = {
    dump: types.Event("Dump"),
    download: types.Event("Download")
};

/**
 * Serialization of a presentation graph to/from the
 * Voyager 3D Presentation format.
 */

export default class CVPresentationData extends Component
{
    static readonly type: string = "CVPresentationData";
    static readonly mimeType = "application/si-dpo-3d.presentation+json";

    ins = this.addInputs(_inputs);

    url: string = "";
    assetPath: string = "";
    assetBaseName: string = "";

    get urlPath() {
        return resolvePathname(".", this.url);
    }
    get urlName() {
        return this.url.substr(this.urlPath.length);
    }

    setUrl(url: string, assetPath?: string, assetBaseName?: string)
    {
        this.url = url;

        this.assetPath = assetPath || this.urlPath || "";
        this.assetBaseName = assetBaseName || "";

        this.node.name = this.urlName;
    }

    protected get setupNode() {
        return this.graph.nodes.get(NVPresentationConfig);
    }
    protected get sceneNode() {
        return this.graph.nodes.get(NVPresentationScene);
    }

    update()
    {
        const ins = this.ins;

        if (ins.dump.changed) {
            console.log("CPresentationData - dump");
            console.log(JSON.parse(JSON.stringify(this.toData())));
        }
        if (ins.download.changed) {
            download.json(this.toData(), this.urlName || "presentation.json");
        }

        return false;
    }

    fromData(data: IPresentation, callback?: ReferenceCallback)
    {
        this.sceneNode.fromData(data, callback);

        if (data.config && this.setupNode) {
            this.setupNode.fromData(data.config);
        }
    }

    toData(writeReferences: boolean = false): IPresentation
    {
        const data = this.sceneNode.toData(writeReferences);
        data.config = this.setupNode.toData();

        data.info = {
            type: CVPresentationData.mimeType,
            copyright: "Copyright Smithsonian Institution",
            generator: "Voyager Presentation Parser",
            version: "1.2"
        };

        return data as IPresentation;
    }
}