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
import { Dictionary } from "@ff/core/types";

import Component, { ITypedEvent } from "@ff/graph/Component";

import { IAnnotations } from "common/types/item";

import CModel from "../../core/components/CModel";

import Annotation, { Vector3 } from "../models/Annotation";
import Group from "../models/Group";

////////////////////////////////////////////////////////////////////////////////

export interface IAnnotationEvent extends ITypedEvent<"annotation">
{
    add: boolean;
    remove: boolean;
    annotation: Annotation;
}

export interface IGroupEvent extends ITypedEvent<"group">
{
    add: boolean;
    remove: boolean;
    group: Group;
}

export default class CAnnotations extends Component
{
    static readonly type: string = "CAnnotations";

    protected annotations: Dictionary<Annotation> = {};
    protected groups: Dictionary<Group> = {};

    get model() {
        return this.node.components.get(CModel);
    }

    createAnnotation(position?: Vector3, direction?: Vector3, zoneIndex: number = -1): Annotation
    {
        const annotation = new Annotation(uniqueId(6, this.annotations));
        annotation.position = position;
        annotation.direction = direction;
        annotation.zoneIndex = zoneIndex;

        this.addAnnotation(annotation);
        return annotation;
    }

    getAnnotations()
    {
        return Object.keys(this.annotations).map(key => this.annotations[key]);
    }

    getAnnotationById(id: string)
    {
        return this.annotations[id];
    }

    addAnnotation(annotation: Annotation)
    {
        this.annotations[annotation.id] = annotation;
        this.emit<IAnnotationEvent>({ type: "annotation", add: true, remove: false, annotation });
    }

    removeAnnotation(annotation: Annotation)
    {
        delete this.annotations[annotation.id];
        this.emit<IAnnotationEvent>({ type: "annotation", add: false, remove: true, annotation });
    }

    createGroup(): Group
    {
        const group = new Group(uniqueId(6, this.groups));
        this.addGroup(group);
        return group;
    }

    getGroups()
    {
        return Object.keys(this.groups).map(key => this.groups[key]);
    }

    getGroupById(id: string)
    {
        return this.groups[id];
    }

    addGroup(group: Group)
    {
        this.groups[group.id] = group;
        this.emit<IGroupEvent>({ type: "group", add: true, remove: false, group });
    }

    removeGroup(group: Group)
    {
        delete this.groups[group.id];
        this.emit<IGroupEvent>({ type: "group", add: false, remove: true, group });
    }

    deflate()
    {
        const data = this.toData();
        return data ? { data } : null;
    }

    inflate(json: any)
    {
        if (json.data) {
            this.fromData(json);
        }
    }

    toData(): IAnnotations | null
    {
        let data: Partial<IAnnotations> = null;

        const annotationIds = Object.keys(this.annotations);
        if (annotationIds.length > 0) {
            data = data || {};
            data.annotations = annotationIds.map(id => this.annotations[id].deflate());
        }

        const groupIds = Object.keys(this.groups);
        if (groupIds.length > 0) {
            data = data || {};
            data.groups = groupIds.map(id => this.groups[id].deflate());
        }

        return data as IAnnotations;
    }

    fromData(data: IAnnotations)
    {
        if (data.annotations) {
            data.annotations.forEach(data => this.addAnnotation(new Annotation(data.id).inflate(data)));
        }
        if (data.groups) {
            data.groups.forEach(data => this.addGroup(new Group(data.id).inflate(data)));
        }
    }
}