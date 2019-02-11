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
import download from "@ff/browser/download";

import Component, { types } from "@ff/graph/Component";

import { IItem } from "common/types/item";

import CVMeta from "./CVMeta";
import CVProcess from "./CVProcess";
import CVModel from "../../core/components/CVModel";
import CVDocuments from "./CVDocuments";
import CVAnnotations from "./CVAnnotations";

////////////////////////////////////////////////////////////////////////////////

const _inputs = {
    dump: types.Event("Data.Dump"),
    download: types.Event("Data.Download"),
};

/**
 * Serialization of an item node to/from the
 * Voyager 3D Item format.
 */
export default class CVItemData extends Component
{
    static readonly typeName: string = "CVItemData";
    static readonly mimeType = "application/si-dpo-3d.item+json";

    ins = this.addInputs(_inputs);

    url: string = "";

    get urlPath() {
        return resolvePathname(".", this.url);
    }
    get urlName() {
        return this.url.substr(this.urlPath.length);
    }

    setUrl(url: string, assetPath?: string, assetBaseName?: string)
    {
        this.url = url;

        this.model.assetPath = assetPath || this.urlPath || "";
        this.model.assetBaseName = assetBaseName || "";

        this.node.name = this.urlName;
    }

    protected get meta() {
        return this.components.get(CVMeta);
    }
    protected get process() {
        return this.components.get(CVProcess);
    }
    protected get model() {
        return this.components.get(CVModel);
    }
    protected get documents() {
        return this.components.get(CVDocuments);
    }
    protected get annotations() {
        return this.components.get(CVAnnotations);
    }

    update()
    {
        const ins = this.ins;

        if (ins.dump.changed) {
            console.log("CItemData - dump");
            console.log(JSON.parse(JSON.stringify(this.toData())));
        }
        if (ins.download.changed) {
            download.json(this.toData(), this.urlName || "item.json");
        }


        return false;
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
        if (data.documents && this.documents) {
            this.documents.fromData(data.documents);
        }
        if (data.annotations && this.annotations) {
            this.annotations.fromData(data.annotations);
        }
    }

    toData(): IItem
    {
        const data: Partial<IItem> = {
            info: {
                type: CVItemData.mimeType,
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