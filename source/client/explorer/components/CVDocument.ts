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

import CRenderGraph from "@ff/scene/components/CRenderGraph";
import CAssetManager from "@ff/scene/components/CAssetManager";

import { IPresentation } from "common/types/presentation";

import NVDocument from "../nodes/NVDocument";
import NVFeatures from "../nodes/NVFeatures";
import NVRoot from "../nodes/NVRoot";
import NVItem from "../nodes/NVItem";

////////////////////////////////////////////////////////////////////////////////

/**
 * A document is a special kind of document. Its inner graph has a standard structure, and it can
 * be serialized to and from an IPresentation structure which is very similar to a glTF document.
 */
export default class CVDocument extends CRenderGraph
{
    static readonly typeName: string = "CVDocument";
    static readonly mimeType = "application/si-dpo-3d.document+json";

    protected static readonly ins = {
        dump: types.Event("Document.Dump"),
        download: types.Event("Document.Download"),
    };

    protected static readonly outs = {
        active: types.Boolean("Document.Active"),
    };

    ins = this.addInputs(CVDocument.ins);
    outs = this.addOutputs(CVDocument.outs);

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
        return this.features.scene;
    }
    get root() {
        return this.getInnerNode(NVRoot);
    }
    get features() {
        return this.getInnerNode<NVFeatures>("NVFeatures");
    }

    createItem()
    {
        const item = this.innerGraph.createCustomNode(NVItem);
        item.url = this.urlPath + "item.json";
        this.root.transform.addChild(item.transform);
        return item;
    }

    create()
    {
        super.create();

        this.innerGraph.createCustomNode(NVDocument);
        const rootNode = this.innerGraph.createCustomNode(NVRoot);
        const featureNode = this.innerGraph.createCustomNode<NVFeatures>("NVFeatures");
        rootNode.transform.addChild(featureNode.transform);
    }

    update(context)
    {
        super.update(context);

        const ins = this.ins;

        if (ins.dump.changed) {
            const json = this.toDocument();
            console.log("-------------------- VOYAGER DOCUMENT --------------------");
            console.log(JSON.stringify(json, null, 2));
        }

        if (ins.download.changed) {
            download.json(this.toDocument(), this.urlName || "document.json");
        }

        return true;
    }

    activateInnerGraph()
    {
        super.activateInnerGraph();
        this.outs.active.setValue(true);
    }

    deactivateInnerGraph()
    {
        super.deactivateInnerGraph();
        this.outs.active.setValue(false);
    }

    fromDocument(data: IPresentation)
    {
        this.root.fromData(data);

        if (data.features && this.features) {
            this.features.fromData(data.features);
        }
    }

    toDocument(writeReferences: boolean = false): IPresentation
    {
        let data = this.root.toData(writeReferences);
        data.features = this.features.toData();

        const info = {
            type: CVDocument.mimeType,
            copyright: "Copyright Smithsonian Institution",
            generator: "Voyager Document Parser",
            version: "1.4"
        };

        // ensure info is first key in data
        data = Object.assign({ info }, data);

        return data as IPresentation;
    }
}