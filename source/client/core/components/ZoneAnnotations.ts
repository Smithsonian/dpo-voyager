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

import { IZoneAnnotation as IZoneAnnotationData } from "common/types/item";

import Annotations, { IAnnotation } from "./Annotations";
import { Dictionary } from "@ff/core/types";

////////////////////////////////////////////////////////////////////////////////

export interface IZoneAnnotationsChangeEvent extends IComponentChangeEvent<ZoneAnnotations>
{
    what: "add" | "remove",
    annotation: IZoneAnnotation;
}

interface IZoneAnnotation extends IAnnotation
{
    index: number;
}

export default class ZoneAnnotations extends Annotations<IZoneAnnotation>
{
    static readonly type: string = "ZoneAnnotations";

    createAnnotation()
    {
        const annotation = {
            title: "New Annotation",
            description: "",
            expanded: true,
            snapshot: "",
            documents: [],
            groups: [],
            index: 0
        };

        return this.addAnnotation(annotation);
    }

    addAnnotation(annotation: IZoneAnnotation): string
    {
        const id = this.insert(annotation);
        this.emit<IZoneAnnotationsChangeEvent>("change", { what: "add", annotation });
        return id;
    }

    removeAnnotation(id: string): IZoneAnnotation
    {
        const annotation = this.remove(id);

        this.emit<IZoneAnnotationsChangeEvent>("change", { what: "remove", annotation });

        return annotation;
    }

    fromData(data: IZoneAnnotationData[], groupIds: string[], docIds: string[], snapIds: string[])
    {
        super.fromData(data, groupIds, docIds, snapIds);
    }

    toData(groupIds: Dictionary<number>, docIds: Dictionary<number>, snapIds: Dictionary<number>): IZoneAnnotationData[]
    {
        return super.toData(groupIds, docIds, snapIds) as IZoneAnnotationData[];
    }

    protected inflateData(data: IZoneAnnotationData, spot: IZoneAnnotation)
    {
        spot.index = data.index;
    }

    protected deflateData(spot: IZoneAnnotation, data: Partial<IZoneAnnotationData>)
    {
        data.index = spot.index;
    }
}