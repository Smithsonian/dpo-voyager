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

import * as THREE from "three";

import uniqueId from "@ff/core/uniqueId";
import { Dictionary } from "@ff/core/types";

import HTMLSpriteGroup, { HTMLSprite } from "@ff/three/HTMLSpriteGroup";
import { ITypedEvent } from "@ff/graph/Component";
import CObject3D, { IRenderContext, IPointerEvent } from "@ff/scene/components/CObject3D";

import { IAnnotations } from "common/types/item";

import CVModel from "../../core/components/CVModel";

import PinSprite from "../annotations/PinSprite";
import LabelSprite from "../annotations/LabelSprite";

import Annotation, { Vector3 } from "../models/Annotation";
import Group from "../models/Group";
import AnnotationSprite from "../annotations/AnnotationSprite";

////////////////////////////////////////////////////////////////////////////////

export { Annotation, Group };

export interface IActiveAnnotationEvent extends ITypedEvent<"active-annotation">
{
    previous: Annotation;
    next: Annotation;
}

export interface IGroupEvent extends ITypedEvent<"group">
{
    add: boolean;
    remove: boolean;
    group: Group;
}

export default class CVAnnotations extends CObject3D
{
    private _activeAnnotation: Annotation = null;
    private _annotations: Dictionary<Annotation> = {};
    private _sprites: Dictionary<HTMLSprite> = {};
    private _groups: Dictionary<Group> = {};

    protected get model() {
        return this.getComponent(CVModel);
    }

    get activeAnnotation() {
        return this._activeAnnotation;
    }
    set activeAnnotation(annotation: Annotation) {
        if (annotation !== this._activeAnnotation) {
            const previous = this._activeAnnotation;
            this._activeAnnotation = annotation;
            this.emit<IActiveAnnotationEvent>({ type: "active-annotation", previous, next: annotation });

        }
    }

    constructor(id: string)
    {
        super(id);
        this.addEvents("active-annotation", "group");
    }

    create()
    {
        super.create();

        this.object3D = new HTMLSpriteGroup();
        this.on<IPointerEvent>("pointer-up", this.onPointerUp, this);
    }

    postRender(context: IRenderContext)
    {
        const spriteGroup = this.object3D as HTMLSpriteGroup;
        spriteGroup.render(context.viewport, context.camera);
    }

    dispose()
    {
        (this.object3D as HTMLSpriteGroup).dispose();
        this.off<IPointerEvent>("pointer-up", this.onPointerUp, this);

        super.dispose();
    }

    getAnnotations()
    {
        return Object.keys(this._annotations).map(key => this._annotations[key]);
    }

    getAnnotationById(id: string)
    {
        return this._annotations[id];
    }

    addAnnotation(annotation: Annotation)
    {
        if (!annotation.id) {
            annotation.id = uniqueId(6, this._annotations);
        }

        this._annotations[annotation.id] = annotation;
        this.createSprite(annotation);
    }

    removeAnnotation(annotation: Annotation)
    {
        const keys = Object.keys(this._annotations);
        delete this._annotations[annotation.id];
        this.removeSprite(annotation);

        if (annotation === this.activeAnnotation) {
            // select next annotation as active annotation
            const index = Math.min(keys.indexOf(annotation.id) + 1, keys.length - 1);
            this.activeAnnotation = index < 0 ? null : this._annotations[keys[index]];
        }
    }

    createGroup(): Group
    {
        const group = new Group(uniqueId(6, this._groups));
        this.addGroup(group);
        return group;
    }

    getGroups()
    {
        return Object.keys(this._groups).map(key => this._groups[key]);
    }

    getGroupById(id: string)
    {
        return this._groups[id];
    }

    addGroup(group: Group)
    {
        this._groups[group.id] = group;
        this.emit<IGroupEvent>({ type: "group", add: true, remove: false, group });
    }

    removeGroup(group: Group)
    {
        delete this._groups[group.id];
        this.emit<IGroupEvent>({ type: "group", add: false, remove: true, group });
    }

    annotationUpdated(annotation: Annotation)
    {
        this.updateSprite(annotation);
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

        const annotationIds = Object.keys(this._annotations);
        if (annotationIds.length > 0) {
            data = data || {};
            data.annotations = annotationIds.map(id => this._annotations[id].deflate());
        }

        const groupIds = Object.keys(this._groups);
        if (groupIds.length > 0) {
            data = data || {};
            data.groups = groupIds.map(id => this._groups[id].deflate());
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

    protected onPointerUp(event: IPointerEvent)
    {
        if (event.isDragging) {
            return;
        }

        let target = event.object3D as AnnotationSprite;

        while(target && !target.isHTMLSprite) {
            target = target.parent as AnnotationSprite;
        }

        if (target) {
            this.activeAnnotation = target.annotation;
        }
    }

    protected createSprite(annotation: Annotation)
    {
        this.removeSprite(annotation);

        let sprite;
        switch(annotation.style) {
            case "pin":
                sprite = new PinSprite(annotation);
                break;
            default:
                sprite = new LabelSprite(annotation);
                break;
        }

        this._sprites[annotation.id] = sprite;
        (this.object3D as HTMLSpriteGroup).add(sprite);
        this.registerPickableObject3D(sprite, true);
    }

    protected removeSprite(annotation: Annotation)
    {
        const sprite = this._sprites[annotation.id];
        if (sprite) {
            this._sprites[annotation.id] = undefined;
            (this.object3D as HTMLSpriteGroup).remove(sprite);
            this.unregisterPickableObject3D(sprite, true);
        }
    }

    protected updateSprite(annotation: Annotation)
    {
        const sprite = this._sprites[annotation.id];
        if (sprite) {
            (this.object3D as HTMLSpriteGroup).update(sprite);
        }
    }
}