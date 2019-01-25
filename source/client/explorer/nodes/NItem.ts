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

import CModel from "../../core/components/CModel";
import CMeta from "../components/CMeta";
import CProcess from "../components/CProcess";
import CAnnotations from "../components/CAnnotations";
import CDocuments from "../components/CDocuments";

////////////////////////////////////////////////////////////////////////////////

export default class NItem extends NTransform
{
    static readonly type: string = "NItem";
    static readonly mimeType = "application/si-dpo-3d.item+json";

    get meta() {
        return this.components.get(CMeta);
    }
    get process() {
        return this.components.get(CProcess);
    }
    get model() {
        return this.components.get(CModel);
    }
    get documents() {
        return this.components.get(CDocuments);
    }
    get annotations() {
        return this.components.get(CAnnotations);
    }

    get url() {
        return this.model.url;
    }

    setUrl(url: string, assetPath?: string)
    {
        this.model.setUrl(url, assetPath);

        const urlName = url.substr(resolvePathname(".", url).length);
        if (urlName) {
            this.name = urlName;
        }
    }

    createComponents()
    {
        super.createComponents();

        this.createComponent(CMeta);
        this.createComponent(CProcess);
        this.createComponent(CModel);
        this.createComponent(CAnnotations);
        this.createComponent(CDocuments);

        this.name = "Item";
    }

    fromData(data: IItem)
    {
        if (data.meta) {
            this.meta.fromData(data.meta);
        }
        if (data.process) {
            this.process.fromData(data.process);
        }
        if (data.model) {
            this.model.fromData(data.model);
        }
        if (data.documents) {
            this.documents.fromData(data.documents);
        }
        if (data.annotations) {
            this.annotations.fromData(data.annotations);
        }
    }

    toData(): IItem
    {
        const data: Partial<IItem> = {
            info: {
                type: NItem.mimeType,
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

        const documentsData = this.documents.toData();
        if (documentsData) {
            data.documents = documentsData;
        }

        const annotationsData = this.annotations.toData();
        if (annotationsData) {
            data.annotations = annotationsData;
        }

        return data as IItem;
    }
}