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

import NTransform from "@ff/scene/nodes/NTransform";

//import { IItem } from "common/types/item";

import { EDerivativeQuality } from "common/types/model";

import CVModel2 from "../components/CVModel2";
import CVAssetReader from "../components/CVAssetReader";
//import { EDerivativeQuality } from "../../core/models/Derivative";
//import CVAssetLoader from "../../core/components/CVAssetLoader";

////////////////////////////////////////////////////////////////////////////////

export default class NVMiniItem extends NTransform
{
    static readonly typeName: string = "NVMiniItem";
    static readonly mimeType = "application/si-dpo-3d.item+json";

    private _url = "";

    get model() {
        return this.getComponent(CVModel2);
    }

    set url(url: string) {
        this._url = url;
        this.name = this.urlName;
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

    createComponents()
    {
        super.createComponents();
        this.createComponent(CVModel2);
    }

    loadItem(itemUrl: string)
    {
        this.url = itemUrl;
        const loader = this.getMainComponent(CVAssetReader);
        loader.getJSON(itemUrl).then(json => this.fromData(json));
    }

    loadModelAsset(quality: EDerivativeQuality, modelUrl: string)
    {
        const model = this.model;
        model.derivatives.createModelAsset(quality, modelUrl);
    }

    loadMeshAsset(quality: EDerivativeQuality, geoUrl: string, colorMapUrl?: string,
        occlusionMapUrl?: string, normalMapUrl?: string)
    {
        const model = this.model;
        model.derivatives.createMeshAsset(quality, geoUrl, colorMapUrl);
    }

    fromData(data: IItem)
    {
        if (data.model && this.model) {
            this.model.fromData(data.model);
        }
    }

    toData(): IItem
    {
        throw new Error("base NVItem can't serialize to data");
    }
}