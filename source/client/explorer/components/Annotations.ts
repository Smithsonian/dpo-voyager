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
import { IComponentChangeEvent } from "@ff/graph/Component";

import { IAnnotation as IAnnotationData, Vector3 } from "common/types/item";

import Model from "../../core/components/Model";
import Collection from "./Collection";

////////////////////////////////////////////////////////////////////////////////

export { Vector3 };

export interface IAnnotationsChangeEvent extends IComponentChangeEvent<Annotations>
{
    what: "add" | "remove" | "update",
    annotation: IAnnotation;
}

export interface IAnnotation
{
    id?: string;
    title: string;
    description: string;
    visible: boolean;
    expanded: boolean;
    snapshot: string;
    documents: string[];
    groups: string[];
    position: Vector3;
    direction: Vector3;
    index: number;
}

export default class Annotations extends Collection<IAnnotation>
{
    static readonly type: string = "Annotations";

    protected model: Model = null;

    create()
    {
        super.create();
        this.model = this.components.get(Model);
    }

    createAnnotation(position: Vector3, direction: Vector3, index: number = -1): IAnnotation
    {
        const annotation = {
            title: "New Annotation",
            description: "",
            visible: true,
            expanded: true,
            snapshot: "",
            documents: [],
            groups: [],
            position,
            direction,
            index
        };

        this.addAnnotation(annotation);
        return annotation;
    }

    setEnabled(enabled: boolean)
    {
        this.getArray().forEach(annotation => annotation.visible = enabled);
        this.emit<IAnnotationsChangeEvent>({ type: "change", what: "update", annotation: null, component: this });
    }

    setVisible(id: string, visible: boolean)
    {
        const annotation = this.get(id);
        annotation.visible = visible;
        this.emit<IAnnotationsChangeEvent>({ type: "change", what: "update", annotation, component: this });
    }

    setExpanded(id: string, expanded: boolean)
    {
        const annotation = this.get(id);
        annotation.expanded = expanded;
        this.emit<IAnnotationsChangeEvent>({ type: "change", what: "update", annotation, component: this });
    }

    setPosition(id: string, position: Vector3, direction: Vector3)
    {
        const annotation = this.get(id);
        annotation.position = position;
        annotation.direction = direction;
        this.emit<IAnnotationsChangeEvent>({ type: "change", what: "update", annotation, component: this });
    }

    setTitle(id: string, title: string)
    {
        const annotation = this.get(id);
        annotation.title = title;
        this.emit<IAnnotationsChangeEvent>({ type: "change", what: "update", annotation, component: this });
    }

    setDescription(id: string, description: string)
    {
        const annotation = this.get(id);
        annotation.description = description;
        this.emit<IAnnotationsChangeEvent>({ type: "change", what: "update", annotation, component: this });
    }

    addAnnotation(annotation: IAnnotation): string
    {
        const id = this.insert(annotation);
        this.emit<IAnnotationsChangeEvent>({ type: "change", what: "add", annotation, component: this });
        return id;
    }

    removeAnnotation(id: string): IAnnotation
    {
        const annotation = this.remove(id);
        this.emit<IAnnotationsChangeEvent>({ type: "change", what: "remove", annotation, component: this });
        return annotation;
    }

    fromData(data: IAnnotationData[], groupIds: string[], docIds: string[], snapIds: string[])
    {
        data.forEach(data => {
            const annotation = {
                title: data.title || "",
                description: data.description || "",
                visible: data.visible || false,
                expanded: data.expanded || false,
                snapshot: data.snapshot !== undefined ? snapIds[data.snapshot] : "",
                documents: data.documents ? data.documents.map(index => docIds[index]) : [],
                groups: data.groups ? data.groups.map(index => groupIds[index]) : [],
                position: data.position,
                direction: data.direction,
                index: data.zoneIndex !== undefined ? data.zoneIndex : -1
            };

            this.addAnnotation(annotation);
        });
    }

    toData(groupIds: Dictionary<number>, docIds: Dictionary<number>, snapIds: Dictionary<number>): IAnnotationData[]
    {
        const annotations = this.getArray();

        return annotations.map(annotation => {
            const data: IAnnotationData = {
                title: annotation.title,
                position: annotation.position.slice(),
                direction: annotation.direction.slice()
            };

            if (annotation.description) {
                data.description = annotation.description;
            }
            if (annotation.visible) {
                data.visible = annotation.visible;
            }
            if (annotation.expanded) {
                data.expanded = annotation.expanded;
            }
            if (annotation.snapshot) {
                data.snapshot = snapIds[annotation.snapshot];
            }
            if (annotation.documents.length > 0) {
                data.documents = annotation.documents.map(id => docIds[id]);
            }
            if (annotation.groups.length > 0) {
                data.groups = annotation.groups.map(id => groupIds[id]);
            }
            if (annotation.index > -1) {
                data.zoneIndex = annotation.index;
            }

            return data;
        });
    }
}