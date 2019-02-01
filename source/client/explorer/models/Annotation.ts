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

import { Identifier } from "@ff/core/types";
import uniqueId from "@ff/core/uniqueId";

import { IAnnotation } from "common/types/item";

////////////////////////////////////////////////////////////////////////////////

export type Vector3 = number[];


export default class Annotation
{
    readonly id: string;

    title: string = "New Annotation";
    description: string = "";
    style: string = "";
    expanded: boolean = false;
    documents: Identifier[] = [];
    groups: Identifier[] = [];
    position: Vector3 = null;
    direction: Vector3 = null;
    zoneIndex: number = -1;


    constructor(id: string)
    {
        this.id = id || uniqueId(6);
    }

    deflate(): IAnnotation
    {
        const data: Partial<IAnnotation> = { id: this.id };

        if (this.title) {
            data.title = this.title;
        }
        if (this.description) {
            data.description = this.description;
        }
        if (this.style) {
            data.style = this.style;
        }
        if (this.expanded) {
            data.expanded = this.expanded;
        }
        if (this.documents.length > 0) {
            data.documents = this.documents.slice();
        }
        if (this.groups.length > 0) {
            data.groups = this.groups.slice();
        }
        if (this.position) {
            data.position = this.position.slice();
        }
        if (this.direction) {
            data.direction = this.direction.slice();
        }
        if (this.zoneIndex > -1) {
            data.zoneIndex = this.zoneIndex;
        }

        return data as IAnnotation;
    }

    inflate(data: IAnnotation): Annotation
    {
        this.title = data.title || "";
        this.description = data.description || "";
        this.style = data.style || "";
        this.expanded = data.expanded || false;
        this.documents = data.documents ? data.documents.slice() : [];
        this.groups = data.groups ? data.groups.slice() : [];

        this.position = data.position.slice();
        this.direction = data.direction.slice();
        this.zoneIndex = data.zoneIndex !== undefined ? data.zoneIndex : -1;

        return this;
    }
}