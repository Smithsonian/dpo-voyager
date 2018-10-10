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

import Entity from "@ff/core/ecs/Entity";

import MetaComponent from "../components/Meta";
import ProcessComponent from "../components/Process";
import ModelComponent from "../components/Model";
import DerivativesComponent from "../components/Derivatives";
import DocumentsComponent from "../components/Documents";
import GroupsComponent from "../components/Groups";
import SpotAnnotationsComponent from "../components/SpotAnnotations";
import ZoneAnnotationsComponent from "../components/ZoneAnnotations";
import ToursComponent from "../components/Tours";
import SnapshotsComponent from "../components/Snapshots";

import { IItem } from "common/types/item";

////////////////////////////////////////////////////////////////////////////////

export default class ItemParser
{
    static inflate(entity: Entity, item: IItem)
    {
        let docIds = [];
        let groupIds = [];
        let snapIds = [];

        if (item.meta) {
            entity.createComponent(MetaComponent)
                .fromData(item.meta);
        }

        if (item.process) {
            entity.createComponent(ProcessComponent)
                .fromData(item.process);
        }

        if (item.model) {
            entity.createComponent(ModelComponent)
                .fromData(item.model);
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
            if (annotationsData.spots) {
                entity.createComponent(SpotAnnotationsComponent)
                    .fromData(annotationsData.spots, groupIds, docIds, snapIds);
            }
            if (annotationsData.zones) {
                entity.createComponent(ZoneAnnotationsComponent)
                    .fromData(annotationsData.zones, groupIds, docIds, snapIds);
            }
        }
    }

    static deflate(entity: Entity): IItem
    {
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
        const spotComponent = entity.getComponent(SpotAnnotationsComponent);
        const zoneComponent = entity.getComponent(ZoneAnnotationsComponent);

        if (groupsComponent || spotComponent || zoneComponent) {
            itemData.annotations = {};

            if (groupsComponent) {
                const { data, ids } = groupsComponent.toData();
                if (data.length > 0) {
                    itemData.annotations.groups = data;
                    groupIds = ids;
                }
            }
            if (spotComponent) {
                const spots = spotComponent.toData(groupIds, docIds, snapIds);
                if (spots.length > 0) {
                    itemData.annotations.spots = spots;
                }
            }
            if (zoneComponent) {
                const zones = zoneComponent.toData(groupIds, docIds, snapIds);
                if (zones.length > 0) {
                    itemData.annotations.zones = zones;
                }
            }
        }

        return itemData as IItem;
    }
}