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
 * See the License for the specific language governing permissions andr
 * limitations under the License.
 */

import resolvePathname from "resolve-pathname";
import download from "@ff/browser/download";

import { types } from "@ff/graph/Component";
import CDocument from "@ff/graph/components/CDocument";
import CAssetManager from "@ff/scene/components/CAssetManager";

import { IPresentation } from "common/types/presentation";

import NVDocument from "../nodes/NVDocument";
import NVFeatures from "../nodes/NVFeatures";
import NVScene from "../nodes/NVScene";
import NVItem from "../nodes/NVItem";

////////////////////////////////////////////////////////////////////////////////

const _inputs = {
    download: types.Event("Data.Download"),
};

/**
 * A presentation is a special kind of document. Its inner graph has a standard structure, and it can
 * be serialized to and from an IPresentation structure which is very similar to a glTF document.
 */
export default class CVDocument extends CDocument
{
    static readonly typeName: string = "CVPresentation";
    static readonly mimeType = "application/si-dpo-3d.presentation+json";

    ins = this.addInputs<CDocument, typeof _inputs>(_inputs);

    private _url: string = "";

    set url(url: string) {
        this._url = url;
        this.name = this.urlName;
        this.getInnerComponent(CAssetManager).assetBaseUrl = url;
    }
    get url() {
        return this._url;
    }
    get urlPath() {
        return resolvePathname(".", this.url);
    }
    get urlName() {
        return this.url.substr(this.urlPath.length);
    }

    get scene() {
        return this.sceneNode.scene;
    }
    get sceneNode() {
        return this.getInnerNode(NVScene);
    }
    get featuresNode() {
        return this.getInnerNode(NVFeatures);
    }

    createItem()
    {
        const item = this.innerGraph.createCustomNode(NVItem);
        item.url = this.urlPath + "item.json";
        this.sceneNode.scene.addChild(item.transform);
        return item;
    }

    create()
    {
        super.create();

        this.innerGraph.createCustomNode(NVDocument);
        const scene = this.innerGraph.createCustomNode(NVScene);
        scene.addChild(this.innerGraph.createCustomNode(NVFeatures));
    }

    update()
    {
        const ins = this.ins;

        if (ins.download.changed) {
            download.json(this.toPresentation(), this.urlName || "presentation.json");
        }

        return false;
    }

    fromPresentation(data: IPresentation)
    {
        this.sceneNode.fromData(data);

        if (data.features && this.featuresNode) {
            this.featuresNode.fromData(data.features);
        }
    }

    toPresentation(writeReferences: boolean = false): IPresentation
    {
        const data = this.sceneNode.toData(writeReferences);
        data.features = this.featuresNode.toData();

        data.info = {
            type: CVDocument.mimeType,
            copyright: "Copyright Smithsonian Institution",
            generator: "Voyager Presentation Parser",
            version: "1.3"
        };

        return data as IPresentation;
    }
}