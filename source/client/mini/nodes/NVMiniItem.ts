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

import { IItem } from "common/types/item";

import CVModel from "../../core/components/CVModel";
import { EDerivativeQuality } from "../../core/models/Derivative";

////////////////////////////////////////////////////////////////////////////////

export default class NVMiniItem extends NTransform
{
    static readonly typeName: string = "NVMiniItem";
    static readonly mimeType = "application/si-dpo-3d.item+json";

    private _url = "";
    private _assetBaseUrl = "";

    get model() {
        return this.getComponent(CVModel);
    }

    set url(url: string) {
        this._url = url;

        if (url.endsWith("item.json")) {
            this._assetBaseUrl = url.substr(0, url.length - 9);
        }
        else {
            const parts = url.split(".");
            parts.pop();
            this._assetBaseUrl = parts.join(".");
        }

        this.name = this.urlName;

        console.log("NVItem.url");
        console.log("   url:          %s", this.url);
        console.log("   urlPath:      %s", this.urlPath);
        console.log("   urlName:      %s", this.urlName);
        console.log("   assetBaseUrl: %s", this.assetBaseUrl);
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
    get assetBaseUrl() {
        return this._assetBaseUrl;
    }

    createComponents()
    {
        super.createComponents();

        this.createComponent(CVModel);

        this.name = "Item";
    }

    createModelAsset(quality: EDerivativeQuality, modelUrl: string)
    {
        const model = this.model;
        model.derivatives.createModelAsset(quality, modelUrl);
    }

    createMeshAsset(quality: EDerivativeQuality, geoUrl: string, colorMapUrl?: string,
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