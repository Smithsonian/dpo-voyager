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

import { IItem } from "common/types/item";

import Model from "../../core/components/CModel";

import CMeta from "../components/CMeta";
import CProcess from "../components/CProcess";
import CAnnotations from "../components/CAnnotations";
import CDocuments from "../components/CDocuments";
import CGroups from "../components/CGroups";

import NPresentationNode from "./NPresentationNode";

////////////////////////////////////////////////////////////////////////////////

export default class NItemNode extends NPresentationNode
{
    static readonly type: string = "NItemNode";

    url: string;

    protected meta: CMeta;
    protected process: CProcess;
    protected model: Model;
    protected annotations: CAnnotations;
    protected documents: CDocuments;
    protected groups: CGroups;


    setUrl(url: string, assetPath?: string)
    {
        this.url = url;
        const urlPath = resolvePathname(".", url);
        this.model.setAssetPath(assetPath || urlPath);
        const urlName = url.substr(urlPath.length);

        if (urlName) {
            this.name = urlName;
        }
    }

    createComponents()
    {
        super.createComponents();

        this.meta = this.createComponent(CMeta);
        this.process = this.createComponent(CProcess);
        this.model = this.createComponent(Model);
        this.annotations = this.createComponent(CAnnotations);
        this.documents = this.createComponent(CDocuments);
        this.groups = this.createComponent(CGroups);

        this.name = "Item";
    }

    fromItemData(itemData: IItem)
    {
        let docIds = [];
        let groupIds = [];
        let snapIds = [];

        if (itemData.meta) {
            this.meta.fromData(itemData.meta);
        }

        if (itemData.process) {
            this.process.fromData(itemData.process);
        }

        if (itemData.model) {
            this.model.fromData(itemData.model);
        }

        if (itemData.documents) {
            docIds = this.documents.fromData(itemData.documents);
        }

        if (itemData.annotations) {
            const annotationsData = itemData.annotations;
            if (annotationsData.groups) {
                groupIds = this.groups.fromData(annotationsData.groups);
            }

            this.annotations.fromData(annotationsData.annotations, groupIds, docIds, snapIds);
        }

        // if (itemData.story) {
        //     const storyData = itemData.story;
        //     this.templateUri = storyData.templateUri;
        //
        //     snapIds = entity.createComponent(Snapshots)
        //     .fromData(storyData.snapshots);
        //
        //     if (storyData.tours) {
        //         entity.createComponent(Tours)
        //         .fromData(storyData.tours, snapIds);
        //     }
        // }
    }

    toItemData(): IItem
    {
        const itemData: Partial<IItem> = {
            model: this.model.toData()
        };

        let docIds = {};
        let groupIds = {};
        let snapIds = {};

        if (this.meta.hasData()) {
            itemData.meta = this.meta.toData();
        }

        if (this.process.hasData()) {
            itemData.process = this.process.toData();
        }

        {
            const { data, ids } = this.documents.toData();
            if (data.documents.length > 0) {
                itemData.documents = data;
                docIds = ids;
            }
        }

        // const { _snapData, _snapIds } = this.snapshots.toData();
        // if (_snapData.length > 0) {
        //     itemData.story = { snapshots: _snapData };
        //     snapIds = _snapIds;
        // }
        //
        // itemData.story.tours = this.tours.toData(snapIds);


        let groups = null;

        {
            const { data, ids } = this.groups.toData();
            if (data.length > 0) {
                groups = data;
                groupIds = ids;
            }
        }

        const annotations = this.annotations.toData(groupIds, docIds, snapIds);
        if (annotations.length > 0) {
            itemData.annotations = {
                annotations,
                groups
            };
        }

        return itemData as IItem;
    }
}