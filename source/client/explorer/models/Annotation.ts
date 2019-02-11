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
import { IAnnotation } from "common/types/item";

////////////////////////////////////////////////////////////////////////////////

export type Vector3 = number[];

export enum EAnnotationStyle { Default, Line, Balloon }

export default class Annotation
{
    id: string;
    title: string = "New Annotation";
    description: string = "";
    style: EAnnotationStyle = EAnnotationStyle.Default;
    visible: boolean = true;
    expanded: boolean = false;
    scale: number = 1;
    offset: number = 0;
    tilt: number = 0;
    azimuth: number = 0;
    documents: Identifier[] = [];
    groups: Identifier[] = [];
    position: Vector3 = null;
    direction: Vector3 = null;
    zoneIndex: number = -1;


    constructor(id?: string)
    {
        this.id = id || "";
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
        if (this.style !== EAnnotationStyle.Default) {
            data.style = EAnnotationStyle[this.style];
        }
        if (this.visible === false) {
            data.visible = this.visible;
        }
        // TODO: Decide whether to serialize
        // if (this.expanded) {
        //     data.expanded = this.expanded;
        // }
        if (this.scale !== 1) {
            data.scale = this.scale;
        }
        if (this.offset !== 0) {
            data.offset = this.offset;
        }
        if (this.tilt !== 0) {
            data.tilt = this.tilt;
        }
        if (this.azimuth !== 0) {
            data.azimuth = this.azimuth;
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
        this.style = EAnnotationStyle[data.style] || EAnnotationStyle.Default;
        this.visible = data.visible !== undefined ? data.visible : true;
        this.expanded = data.expanded || false;
        this.scale = data.scale !== undefined ? data.scale : 1;
        this.offset = data.offset || 0;
        this.tilt = data.tilt || 0;
        this.azimuth = data.azimuth || 0;
        this.documents = data.documents ? data.documents.slice() : [];
        this.groups = data.groups ? data.groups.slice() : [];

        this.position = data.position.slice();
        this.direction = data.direction.slice();
        this.zoneIndex = data.zoneIndex !== undefined ? data.zoneIndex : -1;

        return this;
    }
}