/**
 * 3D Foundation Project
 * Copyright 2019 Smithsonian Institution
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

import fetch from "@ff/browser/fetch";
import Component, { Node, types } from "@ff/graph/Component";

import JSONWriter from "../io/JSONWriter";
import { INodeComponents } from "../nodes/NVNode";

import CVDocument from "./CVDocument";
import CVAssetReader, { AssetLoadingManager, IAssetService } from "./CVAssetReader";

////////////////////////////////////////////////////////////////////////////////

export default class CVAssetWriter extends Component implements IAssetService
{
    static readonly typeName: string = "CVAssetWriter";

    protected static readonly ins = {
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

    get assetReader() {
        return this.getMainComponent(CVAssetReader);
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

    getAssetName(pathOrUrl: string)
    {
        return this.assetReader.getAssetName(pathOrUrl);
    }

    getAssetPath(url: string)
    {
        return this.assetReader.getAssetPath(url);
    }

    getAssetURL(assetPath: string)
    {
        return this.assetReader.getAssetURL(assetPath);
    }

    putJSON(json: any, assetPath: string): Promise<void>
    {
        const url = this.getAssetURL(assetPath);
        return this.jsonWriter.put(json, url);
    }

    putText(text: string, assetPath: string): Promise<string>
    {
        const url = this.getAssetURL(assetPath);
        return fetch.text(url, "PUT", text);
    }

    putDocument(document: CVDocument, components?: INodeComponents, assetPath?: string): Promise<void>
    {
        const url = this.getAssetURL(assetPath || document.outs.assetPath.value);
        const documentData = document.deflateDocument(components);

        return this.jsonWriter.put(documentData, url)
    }

}