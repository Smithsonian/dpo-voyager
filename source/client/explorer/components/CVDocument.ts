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
import CVFeatures from "./CVFeatures";

////////////////////////////////////////////////////////////////////////////////

const _inputs = {
    presentationDump: types.Event("Presentation.Dump"),
    presentationDownload: types.Event("Presentation.Download"),
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

        console.log("CVDocument.url");
        console.log("   url:           %s", this.url);
        console.log("   urlPath:       %s", this.urlPath);
        console.log("   urlName:       %s", this.urlName);
    }
    get url() {
        return this._url;
    }
    get urlPath() {
        return resolvePathname(".", this.url);
    }
    get urlName() {
        const path = this.urlPath;
        const nameIndex = this.url.startsWith(path) ? path.length : 0;
        return this.url.substr(nameIndex);
    }

    get scene() {
        return this.sceneNode.scene;
    }
    get sceneNode() {
        return this.getInnerNode(NVScene);
    }
    get features() {
        return this.getInnerComponent(CVFeatures);
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
        const sceneNode = this.innerGraph.createCustomNode(NVScene);
        sceneNode.scene.addChild(this.innerGraph.createCustomNode(NVFeatures).transform);
    }

    update(context)
    {
        super.update(context);

        const ins = this.ins;

        if (ins.presentationDump.changed) {
            const json = this.toPresentation();
            console.log("-------------------- PRESENTATION --------------------");
            console.log(JSON.stringify(json, null, 2));
        }

        if (ins.presentationDownload.changed) {
            download.json(this.toPresentation(), this.urlName || "presentation.json");
        }

        return true;
    }

    fromPresentation(data: IPresentation)
    {
        this.sceneNode.fromData(data);

        if (data.features && this.features) {
            this.features.fromData(data.features);
        }
    }

    toPresentation(writeReferences: boolean = false): IPresentation
    {
        let data = this.sceneNode.toData(writeReferences);
        data.features = this.features.toData();

        const info = {
            type: CVDocument.mimeType,
            copyright: "Copyright Smithsonian Institution",
            generator: "Voyager Presentation Parser",
            version: "1.3"
        };

        // ensure info is first key in data
        data = Object.assign({ info }, data);

        return data as IPresentation;
    }
}