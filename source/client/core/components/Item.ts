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

import { Dictionary } from "@ff/core/types";
import Component from "@ff/core/ecs/Component";
import { IItem } from "common/types";

import Process from "./Process";
import Model from "./Model";
import Documents from "./Documents";
import Groups from "./Groups";
import Annotations from "./Annotations";
import AnnotationsView from "./AnnotationsView";
import Tours from "./Tours";
import Snapshots from "./Snapshots";
import Transform from "./Transform";

import Loaders from "../loaders/Loaders";
import { EDerivativeQuality } from "../app/Derivative";

////////////////////////////////////////////////////////////////////////////////

export default class Item extends Component
{
    static readonly type: string = "Item";

    url: string = "";

    protected templateUri: string = "";
    protected loaders: Loaders = null;
    protected meta: Dictionary<any> = {};

    create()
    {
        this.entity.getOrCreateComponent(Transform);
    }

    get name()
    {
        return this.entity.name;
    }

    get path()
    {
        return resolvePathname(".", this.url);
    }

    get templateName()
    {
        return this.templateUri;
    }

    setLoaders(loaders: Loaders)
    {
        this.loaders = loaders;
    }

    addWebModelDerivative(modelUri: string, quality: EDerivativeQuality)
    {
        this.url = modelUri;
        const modelFile = modelUri.substr(resolvePathname(".", modelUri).length);

        const model = this.entity.getOrCreateComponent(Model);
        model.setAssetLoader(this.loaders.assetLoader, this.path);
        model.addWebModelDerivative(modelFile, quality);
    }

    addGeometryAndTextureDerivative(geometryUri: string, textureUri: string, quality: EDerivativeQuality)
    {
        this.url = geometryUri;
        const geometryFile = geometryUri.substr(resolvePathname(".", geometryUri).length);
        const textureFile = textureUri ? textureUri.substr(resolvePathname(".", textureUri).length) : undefined;

        const model = this.entity.getOrCreateComponent(Model);
        model.setAssetLoader(this.loaders.assetLoader, this.path);
        model.addGeometryAndTextureDerivative(geometryFile, textureFile, quality);
    }

    fromData(data: IItem)
    {
        const entity = this.entity;

        let docIds = [];
        let groupIds = [];
        let snapIds = [];

        this.meta = Object.assign({}, data.meta);

        if (data.process) {
            entity.createComponent(Process)
            .fromData(data.process);
        }

        if (data.model) {
            entity.createComponent(Model).fromData(data.model)
            .setAssetLoader(this.loaders.assetLoader, this.path);
        }

        if (data.documents) {
            const documentsData = data.documents;
            docIds = entity.createComponent(Documents)
            .fromData(documentsData);
        }

        if (data.story) {
            const storyData = data.story;
            this.templateUri = storyData.templateUri;

            snapIds = entity.createComponent(Snapshots)
            .fromData(storyData.snapshots);

            if (storyData.tours) {
                entity.createComponent(Tours)
                .fromData(storyData.tours, snapIds);
            }
        }

        if (data.annotations) {
            const annotationsData = data.annotations;
            if (annotationsData.groups) {
                groupIds = entity.createComponent(Groups)
                .fromData(annotationsData.groups);
            }

            entity.createComponent(Annotations)
            .fromData(annotationsData.annotations, groupIds, docIds, snapIds);
            entity.createComponent(AnnotationsView);
        }
    }

    toData(): IItem
    {
        const entity = this.entity;

        const itemData: Partial<IItem> = {};

        let docIds = {};
        let groupIds = {};
        let snapIds = {};

        itemData.meta = Object.assign({}, this.meta);

        const processComponent = entity.getComponent(Process);
        if (processComponent) {
            itemData.process = processComponent.toData();
        }

        const modelComponent = entity.getComponent(Model);
        if (modelComponent) {
            itemData.model = modelComponent.toData();
        }

        const documentsComponent = entity.getComponent(Documents);
        if (documentsComponent) {
            const { data, ids } = documentsComponent.toData();
            if (data.documents.length > 0) {
                itemData.documents = data;
                docIds = ids;
            }
        }

        const snapshotComponent = entity.getComponent(Snapshots);
        if (snapshotComponent) {
            const { data, ids } = snapshotComponent.toData();
            if (data.length > 0) {
                itemData.story = { snapshots: data };
                snapIds = ids;
            }

            const toursComponent = entity.getComponent(Tours);
            if (toursComponent) {
                itemData.story.tours = toursComponent.toData(snapIds);
            }
        }

        const groupsComponent = entity.getComponent(Groups);
        const annotationsComponent = entity.getComponent(Annotations);

        if (groupsComponent || annotationsComponent) {
            let groups = null;

            if (groupsComponent) {
                const { data, ids } = groupsComponent.toData();
                if (data.length > 0) {
                    groups = data;
                    groupIds = ids;
                }
            }
            const annotations = annotationsComponent.toData(groupIds, docIds, snapIds);
            if (annotations.length > 0) {
                itemData.annotations = {
                    annotations,
                    groups
                };
            }
        }

        return itemData as IItem;
    }
}