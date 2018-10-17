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

import System from "@ff/core/ecs/System";
import Entity from "@ff/core/ecs/Entity";

import { IItem } from "common/types/item";

import MetaComponent from "../components/Meta";
import ProcessComponent from "../components/Process";
import ModelComponent from "../components/Model";
import DerivativesComponent from "../components/Derivatives";
import DocumentsComponent from "../components/Documents";
import GroupsComponent from "../components/Groups";
import AnnotationsComponent from "../components/Annotations";
import AnnotationsViewComponent from "../components/AnnotationsView";
import ToursComponent from "../components/Tours";
import SnapshotsComponent from "../components/Snapshots";

import Loaders from "../loaders/Loaders";
import Transform from "../components/Transform";
import Derivative, { EDerivativeQuality, EDerivativeUsage } from "../app/Derivative";

////////////////////////////////////////////////////////////////////////////////

export default class Item
{
    readonly entity: Entity;

    protected itemUrl: string;
    protected templateUri: string;
    protected loaders: Loaders;

    constructor(system: System, loaders: Loaders)
    {
        this.entity = system.createEntity("Item");
        this.entity.createComponent(Transform);
        this.entity.createComponent(MetaComponent);

        this.itemUrl = "";
        this.templateUri = "";
        this.loaders = loaders;
    }

    get name()
    {
        return this.entity.name;
    }

    get url()
    {
        return this.itemUrl;
    }

    get path()
    {
        return resolvePathname(".", this.itemUrl);
    }

    get templateName()
    {
        return this.templateUri;
    }

    addWebModelDerivative(modelUri: string, quality: EDerivativeQuality)
    {
        this.itemUrl = modelUri;
        const modelFile = modelUri.substr(resolvePathname(".", modelUri).length);

        const model = this.entity.getOrCreateComponent(ModelComponent);
        model.setAssetLoader(this.loaders.assetLoader, this.path);

        const derivatives = this.entity.getOrCreateComponent(DerivativesComponent);
        derivatives.addWebModelDerivative(modelFile, quality);
    }

    inflate(item: IItem, url?: string): this
    {
        const entity = this.entity;

        if (url) {
            this.itemUrl = url;
        }

        let docIds = [];
        let groupIds = [];
        let snapIds = [];

        entity.getComponent(MetaComponent).fromData(item.meta);

        if (item.process) {
            entity.createComponent(ProcessComponent)
            .fromData(item.process);
        }

        if (item.model) {
            entity.createComponent(ModelComponent).fromData(item.model)
                .setAssetLoader(this.loaders.assetLoader, this.path);

            entity.createComponent(DerivativesComponent)
            .fromData(item.model.derivatives);
        }

        if (item.documents) {
            const documentsData = item.documents;
            docIds = entity.createComponent(DocumentsComponent)
            .fromData(documentsData.documents);
        }

        if (item.story) {
            const storyData = item.story;
            this.templateUri = storyData.templateUri;

            snapIds = entity.createComponent(SnapshotsComponent)
            .fromData(storyData.snapshots);

            if (storyData.tours) {
                entity.createComponent(ToursComponent)
                .fromData(storyData.tours, snapIds);
            }
        }

        if (item.annotations) {
            const annotationsData = item.annotations;
            if (annotationsData.groups) {
                groupIds = entity.createComponent(GroupsComponent)
                .fromData(annotationsData.groups);
            }

            entity.createComponent(AnnotationsComponent)
            .fromData(annotationsData.annotations, groupIds, docIds, snapIds);
            entity.createComponent(AnnotationsViewComponent);
        }

        return this;
    }

    deflate(): IItem
    {
        const entity = this.entity;
        const itemData: Partial<IItem> = {};
        let docIds = {};
        let groupIds = {};
        let snapIds = {};

        const metaComponent = entity.getComponent(MetaComponent);
        if (metaComponent) {
            itemData.meta = metaComponent.toData();
        }

        const processComponent = entity.getComponent(ProcessComponent);
        if (processComponent) {
            itemData.process = processComponent.toData();
        }

        const modelComponent = entity.getComponent(ModelComponent);
        if (modelComponent) {
            itemData.model = modelComponent.toData();

            const derivativesComponent = entity.getComponent(DerivativesComponent);
            itemData.model.derivatives = derivativesComponent.toData();
        }

        const documentsComponent = entity.getComponent(DocumentsComponent);
        if (documentsComponent) {
            const { data, ids } = documentsComponent.toData();
            if (data.length > 0) {
                itemData.documents = { documents: data };
                docIds = ids;
            }
        }

        const snapshotComponent = entity.getComponent(SnapshotsComponent);
        if (snapshotComponent) {
            const { data, ids } = snapshotComponent.toData();
            if (data.length > 0) {
                itemData.story = { snapshots: data };
                snapIds = ids;
            }

            const toursComponent = entity.getComponent(ToursComponent);
            if (toursComponent) {
                itemData.story.tours = toursComponent.toData(snapIds);
            }
        }

        const groupsComponent = entity.getComponent(GroupsComponent);
        const annotationsComponent = entity.getComponent(AnnotationsComponent);

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
