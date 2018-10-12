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

import { Dictionary } from "@ff/core/types";

import { IAnnotation as IAnnotationData } from "common/types/item";

import Collection from "./Collection";

////////////////////////////////////////////////////////////////////////////////

export interface IAnnotation
{
    id?: string;
    title: string;
    description: string;
    expanded: boolean;
    snapshot: string;
    documents: string[];
    groups: string[];
}

export default abstract class Annotations<T extends IAnnotation> extends Collection<T>
{
    static readonly type: string = "Annotations";

    fromData(data: IAnnotationData[], groupIds: string[], docIds: string[], snapIds: string[])
    {
        data.forEach(data => {
            const annotation = {
                title: data.title || "",
                description: data.description || "",
                expanded: data.expanded || false,
                snapshot: data.snapshot !== undefined ? snapIds[data.snapshot] : "",
                documents: data.documents ? data.documents.map(index => docIds[index]) : [],
                groups: data.groups ? data.groups.map(index => groupIds[index]) : [],
            };

            this.inflateData(data, annotation);
        });
    }

    toData(groupIds: Dictionary<number>, docIds: Dictionary<number>, snapIds: Dictionary<number>): IAnnotationData[]
    {
        const spots = this.getArray();

        return spots.map(spot => {
            const spotData: IAnnotationData = {
                title: spot.title
            };

            this.deflateData(spot, spotData);

            if (spot.description) {
                spotData.description = spot.description;
            }
            if (spot.expanded) {
                spotData.expanded = spot.expanded;
            }
            if (spot.snapshot) {
                spotData.snapshot = snapIds[spot.snapshot];
            }
            if (spot.documents.length > 0) {
                spotData.documents = spot.documents.map(id => docIds[id]);
            }
            if (spot.groups.length > 0) {
                spotData.groups = spot.groups.map(id => groupIds[id]);
            }

            return spotData;
        });
    }

    protected abstract inflateData(data: IAnnotationData, annotation: IAnnotation);
    protected abstract deflateData(annotation: IAnnotation, data: IAnnotationData);
}