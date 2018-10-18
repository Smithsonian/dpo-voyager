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

import Meta from "../components/Meta";
import Process from "../components/Process";
import Model from "../components/Model";
import Derivatives from "../components/Derivatives";
import Documents from "../components/Documents";
import Groups from "../components/Groups";
import Annotations from "../components/Annotations";
import AnnotationsView from "../components/AnnotationsView";
import Tours from "../components/Tours";
import Snapshots from "../components/Snapshots";

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
        this.entity.createComponent(Meta);

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

        const model = this.entity.getOrCreateComponent(Model);
        model.setAssetLoader(this.loaders.assetLoader, this.path);

        const derivatives = this.entity.getOrCreateComponent(Derivatives);
        derivatives.addWebModelDerivative(modelFile, quality);
    }

    addGeometryAndTextureDerivative(geometryUri: string, textureUri: string, quality: EDerivativeQuality)
    {
        this.itemUrl = geometryUri;
        const geometryFile = geometryUri.substr(resolvePathname(".", geometryUri).length);
        const textureFile = textureUri ? textureUri.substr(resolvePathname(".", textureUri).length) : undefined;

        const model = this.entity.getOrCreateComponent(Model);
        model.setAssetLoader(this.loaders.assetLoader, this.path);

        const derivatives = this.entity.getOrCreateComponent(Derivatives);
        derivatives.addGeometryAndTextureDerivative(geometryFile, textureFile, quality);
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

        entity.getComponent(Meta).fromData(item.meta);

        if (item.process) {
            entity.createComponent(Process)
            .fromData(item.process);
        }

        if (item.model) {
            entity.createComponent(Model).fromData(item.model)
                .setAssetLoader(this.loaders.assetLoader, this.path);

            entity.createComponent(Derivatives)
            .fromData(item.model.derivatives);
        }

        if (item.documents) {
            const documentsData = item.documents;
            docIds = entity.createComponent(Documents)
            .fromData(documentsData.documents);
        }

        if (item.story) {
            const storyData = item.story;
            this.templateUri = storyData.templateUri;

            snapIds = entity.createComponent(Snapshots)
            .fromData(storyData.snapshots);

            if (storyData.tours) {
                entity.createComponent(Tours)
                .fromData(storyData.tours, snapIds);
            }
        }

        if (item.annotations) {
            const annotationsData = item.annotations;
            if (annotationsData.groups) {
                groupIds = entity.createComponent(Groups)
                .fromData(annotationsData.groups);
            }

            entity.createComponent(Annotations)
            .fromData(annotationsData.annotations, groupIds, docIds, snapIds);
            entity.createComponent(AnnotationsView);
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

        const metaComponent = entity.getComponent(Meta);
        if (metaComponent) {
            itemData.meta = metaComponent.toData();
        }

        const processComponent = entity.getComponent(Process);
        if (processComponent) {
            itemData.process = processComponent.toData();
        }

        const modelComponent = entity.getComponent(Model);
        if (modelComponent) {
            itemData.model = modelComponent.toData();

            const derivativesComponent = entity.getComponent(Derivatives);
            itemData.model.derivatives = derivativesComponent.toData();
        }

        const documentsComponent = entity.getComponent(Documents);
        if (documentsComponent) {
            const { data, ids } = documentsComponent.toData();
            if (data.length > 0) {
                itemData.documents = { documents: data };
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
