/**
 * 3D Foundation Project
 * Copyright 2024 Smithsonian Institution
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

import { ITypedEvent, Node, types } from "@ff/graph/Component";

import Viewport, { IViewportDisposeEvent } from "@ff/three/Viewport";
import HTMLSpriteGroup, { HTMLSprite } from "@ff/three/HTMLSpriteGroup";

import CObject3D, { IRenderContext } from "@ff/scene/components/CObject3D";

import Annotation from "../models/Annotation";

import { IAnnotationClickEvent } from "../annotations/AnnotationSprite";
import AnnotationFactory from "../annotations/AnnotationFactory";

import "../annotations/StandardSprite";
import "../annotations/ExtendedSprite";
import "../annotations/CircleSprite";

////////////////////////////////////////////////////////////////////////////////

export { Annotation, IAnnotationClickEvent };

export interface IAnnotationsUpdateEvent extends ITypedEvent<"annotation-update">
{
    annotation: Annotation;
}

export interface ITagUpdateEvent extends ITypedEvent<"tag-update">
{
}

export default class CVStaticAnnotationView extends CObject3D
{
    static readonly typeName: string = "CVStaticAnnotationView";

    static readonly ins = {
        unitScale: types.Number("Transform.UnitScale", { preset: 1, precision: 5 })
        /*activeTags: types.String("Tags.Active"),
        title: types.String("Annotation.Title"),
        lead: types.String("Annotation.Lead"),
        marker: types.String("Annotation.Marker"),
        tags: types.String("Annotation.Tags"),
        style: types.Option("Annotation.Style", AnnotationFactory.typeNames),
        scale: types.Scale("Annotation.Scale", { preset: 1, precision: 3 }),
        offset: types.Number("Annotation.Offset", { preset: 0, precision: 3 }),
        article: types.Option("Annotation.Article", []),
        image: types.String("Annotation.Image"),
        imageCredit: types.String("Image.Credit"),
        imageAltText: types.String("Image.AltText"),
        audioId: types.String("Annotation.AudioID"),
        tilt: types.Number("Annotation.Tilt"),
        azimuth: types.Number("Annotation.Azimuth"),
        color: types.ColorRGB("Annotation.Color"),*/
    };

    ins = this.addInputs<CObject3D, typeof CVStaticAnnotationView.ins>(CVStaticAnnotationView.ins);

    //private _activeAnnotation: Annotation = null;
    private _annotations: Dictionary<Annotation> = {};

    private _viewports = new Set<Viewport>();
    private _sprites: Dictionary<HTMLSprite> = {};  

    constructor(node: Node, id: string)
    {
        super(node, id);

        this.object3D = new HTMLSpriteGroup();
        (this.object3D as HTMLSpriteGroup).setVisible(false);
    }


    update(context)
    {
        super.update(context);

        const ins = this.ins;
        const object3D = this.object3D;

        if (ins.unitScale.changed) {
            object3D.scale.setScalar(ins.unitScale.value);
            object3D.updateMatrix();
        }
        
        if (ins.visible.changed) {
            (object3D as HTMLSpriteGroup).setVisible(ins.visible.value);
        }

        return true;
    }

    tock()
    {
        // if updated, render a second frame to properly update annotation sprites
        if (this.updated) {
            return true;
        }
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

        this._viewports.forEach(viewport => viewport.off("dispose", this.onViewportDispose, this));
        this._viewports.clear();

        super.dispose();
    }

    addAnnotation(annotation: Annotation)
    {
        this._annotations[annotation.id] = annotation;
        this.createSprite(annotation);

        this.changed = true;
    }

    removeAnnotation(annotation: Annotation)
    {
        const keys = Object.keys(this._annotations);
        delete this._annotations[annotation.id];
        this.removeSprite(annotation);

        this.changed = true;
    }

    updateAnnotation(annotation: Annotation, forceSprite?: boolean)
    {
        if(forceSprite) {
            this.updateSprite(annotation);
        }
        
        this.changed = true;
    }

    protected onViewportDispose(event: IViewportDisposeEvent)
    {
        const group = this.object3D as HTMLSpriteGroup;
        group.disposeHTMLElements(event.viewport.overlay);
    }


    protected createSprite(annotation: Annotation)
    {
        this.removeSprite(annotation);

        const sprite = AnnotationFactory.createInstance(annotation);

        this._sprites[annotation.id] = sprite;
        this.object3D.add(sprite);
    }

    protected removeSprite(annotation: Annotation)
    {
        const sprite = this._sprites[annotation.id];

        if (sprite) {
            sprite.dispose();

            this._sprites[annotation.id] = undefined;
            this.object3D.remove(sprite);
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