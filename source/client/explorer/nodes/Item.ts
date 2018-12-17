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

import { Node } from "@ff/graph";
import Transform from "@ff/scene/components/Transform";

import { IItem } from "common/types";

import Meta from "../components/Meta";
import Process from "../components/Process";
import Model from "../components/Model";
import Annotations from "../components/Annotations";
import Documents from "../components/Documents";
import Groups from "../components/Groups";


////////////////////////////////////////////////////////////////////////////////

export default class Item extends Node
{
    protected get meta() {
        return this.components.get(Meta);
    }
    protected get process() {
        return this.components.get(Process);
    }
    protected get model() {
        return this.components.get(Model);
    }
    protected get annotations() {
        return this.components.get(Annotations);
    }
    protected get documents() {
        return this.components.get(Documents);
    }
    protected get groups() {
        return this.components.get(Groups);
    }

    create()
    {
        this.name = "Item";

        this.createComponent(Transform);
        this.createComponent(Meta);
        this.createComponent(Model);
        this.createComponent(Annotations);
        this.createComponent(Documents);
    }

    fromData(data: IItem, loaders, path: string)
    {
        let docIds = [];
        let groupIds = [];
        let snapIds = [];

        if (data.meta) {
            this.meta.fromData(data.meta);
        }

        if (data.process) {
            this.process.fromData(data.process);
        }

        if (data.model) {
            this.model.setAssetLoader(loaders.assetLoader, path);
            this.model.fromData(data.model);
        }

        if (data.documents) {
            docIds = this.documents.fromData(data.documents);
        }

        if (data.annotations) {
            const annotationsData = data.annotations;
            if (annotationsData.groups) {
                groupIds = this.groups.fromData(annotationsData.groups);
            }

            this.annotations.fromData(annotationsData.annotations, groupIds, docIds, snapIds);
        }

        // if (data.story) {
        //     const storyData = data.story;
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

    toData(): IItem
    {
        const itemData: Partial<IItem> = {};

        let docIds = {};
        let groupIds = {};
        let snapIds = {};

        if (this.meta.hasData()) {
            itemData.meta = this.meta.toData();
        }

        if (this.process.hasData()) {
            itemData.process = this.process.toData();
        }

        itemData.model = this.model.toData();

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