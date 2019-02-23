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
import CVMeta from "../components/CVMeta";
import CVProcess from "../components/CVProcess";
import CVAnnotations from "../components/CVAnnotations";
import CVArticles from "../components/CVArticles";

////////////////////////////////////////////////////////////////////////////////

export default class NVItem extends NTransform
{
    static readonly typeName: string = "NVItem";
    static readonly mimeType = "application/si-dpo-3d.item+json";

    private _url = "";
    private _assetBaseUrl = "";

    get meta() {
        return this.getComponent(CVMeta);
    }
    get process() {
        return this.getComponent(CVProcess);
    }
    get model() {
        return this.getComponent(CVModel);
    }
    get articles() {
        return this.getComponent(CVArticles);
    }
    get annotations() {
        return this.getComponent(CVAnnotations);
    }

    set url(url: string) {
        this._url = url;

        if (url.endsWith("-item.json")) {
            this._assetBaseUrl = url.substr(0, url.length - 10);
        }
        else {
            const parts = url.split(".");
            parts.pop();
            this._assetBaseUrl = parts.join(".");
        }
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
    get assetBaseUrl() {
        return this._assetBaseUrl;
    }

    createComponents()
    {
        super.createComponents();

        this.createComponent(CVMeta);
        this.createComponent(CVProcess);
        this.createComponent(CVModel);
        this.createComponent(CVAnnotations);
        this.createComponent(CVArticles);

        this.name = "Item";
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
                copyright: "Copyright Smithsonian Institution",
                generator: "Voyager Item Parser",
                version: "1.2"
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