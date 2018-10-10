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

import { IComponentChangeEvent } from "@ff/core/ecs/Component";

import { ISpotAnnotation as ISpotAnnotationData, Vector3 } from "common/types/item";

import Annotations, { IAnnotation } from "./Annotations";
import { Dictionary } from "@ff/core/types";

////////////////////////////////////////////////////////////////////////////////

export interface ISpotAnnotationsChangeEvent extends IComponentChangeEvent<SpotAnnotations>
{
    what: "add" | "remove",
    annotation: ISpotAnnotation;
}

export interface ISpotAnnotation extends IAnnotation
{
    position: Vector3;
    direction: Vector3;
}

export default class SpotAnnotations extends Annotations<ISpotAnnotation>
{
    static readonly type: string = "SpotAnnotations";

    createAnnotation(position: Vector3, direction: Vector3): string
    {
        const annotation = {
            title: "New Annotation",
            description: "",
            expanded: true,
            snapshot: "",
            documents: [],
            groups: [],
            position,
            direction
        };

        return this.addAnnotation(annotation);
    }

    addAnnotation(annotation: ISpotAnnotation): string
    {
        const id = this.insert(annotation);
        this.emit<ISpotAnnotationsChangeEvent>("change", { what: "add", annotation });
        return id;
    }

    removeAnnotation(id: string): ISpotAnnotation
    {
        const annotation = this.remove(id);
        this.emit<ISpotAnnotationsChangeEvent>("change", { what: "remove", annotation });
        return annotation;
    }

    fromData(data: ISpotAnnotationData[], groupIds: string[], docIds: string[], snapIds: string[])
    {
        super.fromData(data, groupIds, docIds, snapIds);
    }

    toData(groupIds: Dictionary<number>, docIds: Dictionary<number>, snapIds: Dictionary<number>): ISpotAnnotationData[]
    {
        return super.toData(groupIds, docIds, snapIds) as ISpotAnnotationData[];
    }

    protected inflateData(data: ISpotAnnotationData, spot: ISpotAnnotation)
    {
        spot.position = data.position;
        spot.direction = data.direction;
    }

    protected deflateData(spot: ISpotAnnotation, data: Partial<ISpotAnnotationData>)
    {
        data.position = spot.position.slice() as Vector3;
        data.direction = spot.direction.slice() as Vector3;
    }
}