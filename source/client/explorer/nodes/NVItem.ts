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

import CVModel_old from "../../core/components/CVModel_old";
import CVMeta from "../components/CVMeta";
import CVProcess from "../components/CVProcess";
import CVAnnotations_old from "../components/CVAnnotations_old";
import CVArticles from "../components/CVArticles";
import { EDerivativeQuality } from "../../core/models/Derivative";

////////////////////////////////////////////////////////////////////////////////

export interface INote
{
    date: string;
    user: string;
    text: string;
}

export default class NVItem extends NTransform
{
    static readonly typeName: string = "NVItem";
    static readonly mimeType = "application/si-dpo-3d.item+json";

    private _url = "";
    private _assetBaseName = "";

    notes: INote[] = [];

    get meta() {
        return this.getComponent(CVMeta);
    }
    get process() {
        return this.getComponent(CVProcess);
    }
    get model() {
        return this.getComponent(CVModel_old);
    }
    get articles() {
        return this.getComponent(CVArticles);
    }
    get annotations() {
        return this.getComponent(CVAnnotations_old);
    }

    set url(url: string) {
        this._url = url;

        const urlName = this.urlName;
        if (urlName.endsWith("item.json")) {
            this._assetBaseName = urlName.substr(0, urlName.length - 9);
        }
        else {
            const parts = urlName.split(".");
            parts.pop();
            this._assetBaseName = parts.join(".");
        }

        this.name = this.urlName;

        console.log("NVItem.url");
        console.log("   url:           %s", this.url);
        console.log("   urlPath:       %s", this.urlPath);
        console.log("   urlName:       %s", this.urlName);
        console.log("   assetBaseName: %s", this.assetBaseName);
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
    get assetBaseName() {
        return this._assetBaseName;
    }

    getAssetUrl(fileName: string) {
        return resolvePathname(fileName, this.url);
    }

    createComponents()
    {
        super.createComponents();

        this.createComponent(CVMeta);
        this.createComponent(CVProcess);
        this.createComponent(CVModel_old);
        this.createComponent(CVAnnotations_old);
        this.createComponent(CVArticles);

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
        if (data.meta && this.meta) {
            this.meta.fromData(data.meta);
        }
        if (data.process && this.process) {
            this.process.fromData(data.process);
        }
        if (data.model && this.model) {
            this.model.fromData(data.model);
        }
        if (data.articles && this.articles) {
            this.articles.fromData(data.articles);
        }
        if (data.annotations && this.annotations) {
            this.annotations.fromData(data.annotations);
        }
    }

    toData(): IItem
    {
        const data: Partial<IItem> = {
            info: {
                type: NVItem.mimeType,
                copyright: "(c) Smithsonian Institution, all rights reserved",
                generator: "Voyager Item Parser",
                version: "1.3"
            },
            model: this.model.toData()
        };

        const metaData = this.meta.toData();
        if (metaData) {
            data.meta = metaData;
        }

        const processData = this.process.toData();
        if (processData) {
            data.process = processData;
        }

        const articlesData = this.articles.toData();
        if (articlesData) {
            data.articles = articlesData;
        }

        const annotationsData = this.annotations.toData();
        if (annotationsData) {
            data.annotations = annotationsData;
        }

        return data as IItem;
    }
}
