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

import { ITypedEvent, types } from "@ff/graph/Component";

import Viewport, { IViewportDisposeEvent } from "@ff/three/Viewport";
import HTMLSpriteGroup, { HTMLSprite } from "@ff/three/HTMLSpriteGroup";

import CObject3D, { IPointerEvent, IRenderContext } from "@ff/scene/components/CObject3D";

import { IAnnotations } from "common/types/item";

import CVModel from "../../core/components/CVModel";

import Annotation, { EAnnotationStyle } from "../models/Annotation";
import Group from "../models/Group";

import AnnotationSprite, { IAnnotationClickEvent, IAnnotationLinkEvent } from "../annotations/AnnotationSprite";

import PinSprite from "../annotations/PinSprite";
import BeamSprite from "../annotations/BeamSprite";

////////////////////////////////////////////////////////////////////////////////

export { Annotation, Group };

export interface IAnnotationsUpdateEvent extends ITypedEvent<"update">
{
    annotation: Annotation;
}

export interface IGroupEvent extends ITypedEvent<"group">
{
    add: boolean;
    remove: boolean;
    group: Group;
}


const _inputs = {
    unitScale: types.Number("Transform.UnitScale", { preset: 1, precision: 5 }),
    title: types.String("Annotation.Title"),
    description: types.String("Annotation.Description"),
    style: types.Enum("Annotation.Style", EAnnotationStyle, EAnnotationStyle.Default),
    scale: types.Scale("Annotation.Scale", 1),
    offset: types.Number("Annotation.Offset"),
    tilt: types.Number("Annotation.Tilt"),
    azimuth: types.Number("Annotation.Azimuth"),
};

export default class CVAnnotations extends CObject3D
{
    static readonly typeName: string = "CVAnnotations";

    ins = this.addInputs<CObject3D, typeof _inputs>(_inputs);

    private _activeAnnotation: Annotation = null;
    private _annotations: Dictionary<Annotation> = {};
    private _groups: Dictionary<Group> = {};

    private _viewports = new Set<Viewport>();
    private _sprites: Dictionary<HTMLSprite> = {};

    protected get model() {
        return this.getComponent(CVModel);
    }

    get activeAnnotation() {
        return this._activeAnnotation;
    }
    set activeAnnotation(annotation: Annotation) {
        if (annotation !== this._activeAnnotation) {

            const previous = this._activeAnnotation;
            if (previous) {
                previous.expanded = false;
                this.updateSprite(previous);
            }

            this._activeAnnotation = annotation;

            if (annotation) {
                annotation.expanded = true;
                this.updateSprite(annotation);
            }

            const ins = this.ins;
            ins.title.setValue(annotation ? annotation.title : "", true);
            ins.description.setValue(annotation ? annotation.description : "", true);
            ins.style.setValue(annotation ? annotation.style : EAnnotationStyle.Default, true);
            ins.scale.setValue(annotation ? annotation.scale : 1, true);
            ins.offset.setValue(annotation ? annotation.offset : 0, true);

            this.emit<IAnnotationsUpdateEvent>({ type: "update", annotation });
        }
    }

    constructor(id: string)
    {
        super(id);
        this.addEvents("active-annotation", "group");

        this.onSpriteClick = this.onSpriteClick.bind(this);
        this.onSpriteLink = this.onSpriteLink.bind(this);
    }

    create()
    {
        super.create();

        this.object3D = new HTMLSpriteGroup();
        this.on<IPointerEvent>("pointer-up", this.onPointerUp, this);

        this.model.outs.unitScale.linkTo(this.ins.unitScale);
    }

    update(context)
    {
        const ins = this.ins;
        const object3D = this.object3D;
        const annotation = this.activeAnnotation;

        if (ins.unitScale.changed) {
            object3D.scale.setScalar(ins.unitScale.value);
            object3D.updateMatrix();
        }

        if (ins.title.changed) {
            if (annotation) {
                annotation.title = ins.title.value;
            }
        }
        if (ins.description.changed) {
            if (annotation) {
                annotation.description = ins.description.value;
            }
        }
        if (ins.style.changed) {
            if (annotation) {
                annotation.style = ins.style.getValidatedValue();
                this.createSprite(annotation);
            }
        }
        if (ins.scale.changed) {
            if (annotation) {
                annotation.scale = ins.scale.value;
            }
        }
        if (ins.offset.changed) {
            if (annotation) {
                annotation.offset = ins.offset.value;
            }
        }

        if (annotation) {
            this.updateSprite(annotation);
            this.emit<IAnnotationsUpdateEvent>({ type: "update", annotation });
        }

        return super.update(context);
    }

    postRender(context: IRenderContext)
    {
        const viewport = context.viewport;
        if (!this._viewports.has(viewport)) {
            viewport.on<IViewportDisposeEvent>("dispose", this.onViewportDispose, this);
            this._viewports.add(viewport);
        }

        const spriteGroup = this.object3D as HTMLSpriteGroup;
        spriteGroup.render(viewport.overlay, context.camera);
    }

    dispose()
    {
        (this.object3D as HTMLSpriteGroup).dispose();
        this.off<IPointerEvent>("pointer-up", this.onPointerUp, this);

        this._viewports.forEach(viewport => viewport.off("dispose", this.onViewportDispose, this));
        this._viewports.clear();

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

    updateAnnotation(annotation: Annotation)
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

    protected onViewportDispose(event: IViewportDisposeEvent)
    {
        const group = this.object3D as HTMLSpriteGroup;
        group.disposeHTMLContainer(event.viewport.overlay);
    }

    protected onSpriteClick(event: IAnnotationClickEvent)
    {
        this.activeAnnotation = event.annotation;
    }

    protected onSpriteLink(event: IAnnotationLinkEvent)
    {

    }

    protected createSprite(annotation: Annotation)
    {
        this.removeSprite(annotation);

        let sprite;
        switch(annotation.style) {
            case EAnnotationStyle.Balloon:
                sprite = new PinSprite(annotation);
                break;
            case EAnnotationStyle.Line:
            default:
                sprite = new BeamSprite(annotation);
                break;
        }

        sprite.addEventListener("click", this.onSpriteClick);
        sprite.addEventListener("link", this.onSpriteLink);

        this._sprites[annotation.id] = sprite;
        this.object3D.add(sprite);
        this.registerPickableObject3D(sprite, true);
    }

    protected removeSprite(annotation: Annotation)
    {
        const sprite = this._sprites[annotation.id];

        if (sprite) {
            sprite.removeEventListener("click", this.onSpriteClick);
            sprite.removeEventListener("link", this.onSpriteLink);
            sprite.dispose();

            this._sprites[annotation.id] = undefined;
            this.object3D.remove(sprite);
            this.unregisterPickableObject3D(sprite, true);
        }
    }

    protected updateSprite(annotation: Annotation)
    {
        const sprite = this._sprites[annotation.id];
        if (sprite) {
            sprite.update();
        }
    }
}