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

import { IDocument } from "common/types/document";

import NVNode from "../nodes/NVNode";
import NVScene from "../nodes/NVScene";

////////////////////////////////////////////////////////////////////////////////

/**
 * A Voyager document is a special kind of graph. Its inner graph has a standard structure, and it can
 * be serialized to and from an IDocument structure which is compatible with a glTF document.
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

    read(document: IDocument)
    {
        this.getInnerNode(NVScene).fromData(document);
    }

    merge(document: IDocument, node: NVNode)
    {

    }

    write(): IDocument
    {
        return this.getInnerNode(NVScene).toData();
    }



    create()
    {
        super.create();

        this.innerGraph.createCustomNode(NVScene);
    }

    update(context)
    {
        super.update(context);

        const ins = this.ins;

        if (ins.dump.changed) {
            const json = this.write();
            console.log("-------------------- VOYAGER DOCUMENT --------------------");
            console.log(JSON.stringify(json, null, 2));
        }

        if (ins.download.changed) {
            download.json(this.write(), this.urlName || "document.json");
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
}