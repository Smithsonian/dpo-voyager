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

import uniqueId from "@ff/core/uniqueId";
import { Identifier } from "@ff/core/types";

import { IAnnotation } from "common/types/model";

////////////////////////////////////////////////////////////////////////////////

export { IAnnotation };

export type Vector3 = number[];

export enum EAnnotationStyle { Default, Line, Balloon }

export default class Annotation
{
    static fromJSON(json: IAnnotation)
    {
        return new Annotation(json.id).fromJSON(json);
    }

    id: string;
    title: string = "New Annotation";
    lead: string = "";
    tags: string[] = [];
    articles: Identifier[] = [];

    style: EAnnotationStyle = EAnnotationStyle.Default;
    visible: boolean = true;
    expanded: boolean = false;

    position: Vector3 = null;
    direction: Vector3 = null;
    scale: number = 1;
    offset: number = 0;
    tilt: number = 0;
    azimuth: number = 0;

    zoneIndex: number = -1;


    constructor(id?: string)
    {
        this.id = id || uniqueId(6);
    }

    toJSON(): IAnnotation
    {
        const data: Partial<IAnnotation> = {
            id: this.id,
        };

        if (this.title) {
            data.title = this.title;
        }
        if (this.lead) {
            data.lead = this.lead;
        }
        if (this.tags.length > 0) {
            data.tags = this.tags;
        }
        if (this.articles.length > 0) {
            //TODO: Articles/IDs
            //data.articles = this.articles.slice();
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
        if (this.position) {
            data.position = this.position.slice();
        }
        if (this.direction) {
            data.direction = this.direction.slice();
        }
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
        if (this.zoneIndex > -1) {
            data.zoneIndex = this.zoneIndex;
        }

        return data as IAnnotation;
    }

    fromJSON(data: IAnnotation): Annotation
    {
        this.id = data.id;

        this.title = data.title || "";
        this.lead = data.lead || "";
        this.tags = data.tags || [];
        //TODO: Articles/IDs
        //this.articles = data.articles ? data.articles.slice() : [];

        this.style = EAnnotationStyle[data.style] || EAnnotationStyle.Default;
        this.visible = data.visible !== undefined ? data.visible : true;
        this.expanded = data.expanded || false;

        this.position = data.position.slice();
        this.direction = data.direction.slice();
        this.scale = data.scale !== undefined ? data.scale : 1;
        this.offset = data.offset || 0;
        this.tilt = data.tilt || 0;
        this.azimuth = data.azimuth || 0;

        this.zoneIndex = data.zoneIndex !== undefined ? data.zoneIndex : -1;

        return this;
    }
}