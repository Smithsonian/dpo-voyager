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

import Component, { Node, types } from "@ff/graph/Component";

import JSONWriter from "../io/JSONWriter";
import { INodeComponents } from "../nodes/NVNode";

import CVDocument from "./CVDocument";
import { AssetLoadingManager, IAssetService } from "./CVAssetReader";

////////////////////////////////////////////////////////////////////////////////

export default class CVAssetWriter extends Component implements IAssetService
{
    static readonly typeName: string = "CVAssetWriter";

    protected static readonly ins = {
        rootUrl: types.String("Writer.RootURL"),
        setBusy: types.Boolean("Reader.SetBusy"),
    };

    protected static readonly outs = {
        busy: types.Boolean("Writer.IsBusy"),
    };

    ins = this.addInputs(CVAssetWriter.ins);
    outs = this.addOutputs(CVAssetWriter.outs);

    readonly jsonWriter: JSONWriter;

    private _loadingManager: AssetLoadingManager;
    private _isBusy = false;

    constructor(node: Node, id: string)
    {
        super(node, id);

        this._loadingManager = new AssetLoadingManager(this);

        this.jsonWriter = new JSONWriter(this._loadingManager);
    }

    update(context)
    {
        const ins = this.ins;

        if (ins.setBusy.changed) {
            this.outs.busy.setValue(ins.setBusy.value || this._isBusy);
        }

        return true;
    }

    setBusy(isBusy: boolean)
    {
        this._isBusy = isBusy;
        this.outs.busy.setValue(this.ins.setBusy.value || this._isBusy);
    }

    setRootURL(url: string)
    {
        const href = window.location.href.split("?")[0];
        let rootUrl = resolvePathname(url, href);
        rootUrl = resolvePathname(".", rootUrl);
        this.ins.rootUrl.setValue(rootUrl);
        console.log("ROOT URL: %s", rootUrl);
    }

    getAssetURL(uri: string)
    {
        return resolvePathname(uri, this.ins.rootUrl.value);
    }

    putJSON(json: any, assetPath: string): Promise<void>
    {
        const url = this.getAssetURL(assetPath);
        return this.jsonWriter.put(json, url);
    }

    putDocument(document: CVDocument, components?: INodeComponents, assetPath?: string): Promise<void>
    {
        const url = this.getAssetURL(assetPath || document.outs.assetPath.value);
        const documentData = document.deflateDocument(components);

        return this.jsonWriter.put(documentData, url)
    }

}