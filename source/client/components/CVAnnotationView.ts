/**
 * 3D Foundation Project
 * Copyright 2019 Smithsonian Institution
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

import CObject3D, { IPointerEvent, IRenderContext } from "@ff/scene/components/CObject3D";

import CVModel2 from "./CVModel2";
import CVMeta from "./CVMeta";
import CVReader from "./CVReader";

import { IAnnotation } from "client/schema/model";
import Annotation from "../models/Annotation";

import AnnotationSprite, { IAnnotationClickEvent, IAnnotationLinkEvent } from "../annotations/AnnotationSprite";
import AnnotationFactory from "../annotations/AnnotationFactory";

import "../annotations/StandardSprite";
import "../annotations/ExtendedSprite";
import "../annotations/CircleSprite";
import CircleSprite from "../annotations/CircleSprite";
import CVARManager from "./CVARManager";
import StandardSprite from "../annotations/StandardSprite";
import ExtendedSprite from "../annotations/ExtendedSprite";
import CVLanguageManager from "./CVLanguageManager";
import { ELanguageType } from "client/schema/common";

////////////////////////////////////////////////////////////////////////////////

export { Annotation, IAnnotationClickEvent };

export interface IAnnotationsUpdateEvent extends ITypedEvent<"annotation-update">
{
    annotation: Annotation;
}

export interface ITagUpdateEvent extends ITypedEvent<"tag-update">
{
}

export default class CVAnnotationView extends CObject3D
{
    static readonly typeName: string = "CVAnnotationView";

    static readonly ins = {
        unitScale: types.Number("Transform.UnitScale", { preset: 1, precision: 5 }),
        activeTags: types.String("Tags.Active"),
        title: types.String("Annotation.Title"),
        lead: types.String("Annotation.Lead"),
        marker: types.String("Annotation.Marker"),
        tags: types.String("Annotation.Tags"),
        style: types.Option("Annotation.Style", AnnotationFactory.typeNames),
        scale: types.Scale("Annotation.Scale", { preset: 1, precision: 3 }),
        offset: types.Number("Annotation.Offset", { preset: 0, precision: 3 }),
        article: types.Option("Annotation.Article", []),
        image: types.String("Annotation.Image"),
        tilt: types.Number("Annotation.Tilt"),
        azimuth: types.Number("Annotation.Azimuth"),
        color: types.ColorRGB("Annotation.Color"),
    };

    ins = this.addInputs<CObject3D, typeof CVAnnotationView.ins>(CVAnnotationView.ins);

    private _activeAnnotation: Annotation = null;
    private _annotations: Dictionary<Annotation> = {};

    private _viewports = new Set<Viewport>();
    private _sprites: Dictionary<HTMLSprite> = {};

    protected get model() {
        return this.getComponent(CVModel2);
    }
    protected get meta() {
        return this.getComponent(CVMeta, true);
    }
    protected get reader() {
        return this.getGraphComponent(CVReader, true);
    }
    protected get language() {
        return this.getGraphComponent(CVLanguageManager, true);
    }
    protected get articles() {
        const meta = this.meta;
        return meta ? meta.articles : null;
    }
    protected get arManager() {
        return this.system.getMainComponent(CVARManager);
    }

    get activeAnnotation() {
        return this._activeAnnotation;
    }
    set activeAnnotation(annotation: Annotation) {
        if (annotation !== this._activeAnnotation) {

            const previous = this._activeAnnotation;
            if (previous) {
                previous.set("expanded", false);
                this.updateSprite(previous);
            }

            this._activeAnnotation = annotation;

            if (annotation) {
                annotation.set("expanded", true);
                this.updateSprite(annotation);
            }

            const ins = this.ins;
            ins.marker.setValue(annotation ? annotation.data.marker : "", true);
            ins.title.setValue(annotation ? annotation.title : "", true);
            ins.lead.setValue(annotation ? annotation.lead : "", true);
            ins.tags.setValue(annotation ? annotation.tags.join(", ") : "", true);
            ins.style.setOption(annotation ? annotation.data.style : AnnotationFactory.defaultTypeName, true);
            ins.scale.setValue(annotation ? annotation.data.scale : 1, true);
            ins.offset.setValue(annotation ? annotation.data.offset : 0, true);
            ins.tilt.setValue(annotation ? annotation.data.tilt : 0, true);
            ins.azimuth.setValue(annotation ? annotation.data.azimuth : 0, true);
            ins.color.setValue(annotation ? annotation.data.color.slice() : [ 1, 1, 1 ], true);

            const articles = this.articles;
            if (articles) {
                const names = articles.items.map(article => article.title);
                names.unshift("(none)");
                ins.article.setOptions(names);
                const article = annotation ? articles.getById(annotation.data.articleId) : null;
                ins.article.setValue(article ? articles.getIndexOf(article) + 1 : 0, true);
            }
            else {
                ins.article.setOptions([ "(none)" ]);
                ins.article.setValue(0);
            }

            ins.image.setValue(annotation ? annotation.data.imageUri : "", true);

            this.emit<IAnnotationsUpdateEvent>({ type: "annotation-update", annotation });
        }
    }

    constructor(node: Node, id: string)
    {
        super(node, id);
        this.addEvents("active-annotation", "group");

        this.onSpriteClick = this.onSpriteClick.bind(this);
        this.onSpriteLink = this.onSpriteLink.bind(this);

        this.on<IPointerEvent>("pointer-up", this.onPointerUp, this);
        this.system.on<IPointerEvent>("pointer-up", this.onSystemPointerUp, this);

        this.arManager.outs.isPresenting.on("value", this.handleARStateChange, this);
        this.language.outs.language.on("value", this.updateLanguage, this);

        this.object3D = new HTMLSpriteGroup();
    }

    setActiveAnnotationById(id: string)
    {
        this.activeAnnotation = this._annotations[id];
    }

    update(context)
    {
        super.update(context);

        const ins = this.ins;
        const object3D = this.object3D;
        const annotation = this.activeAnnotation;

        if (ins.unitScale.changed) {
            object3D.scale.setScalar(ins.unitScale.value);
            object3D.updateMatrix();
        }
        if (ins.activeTags.changed) {
            const activeTags = ins.activeTags.value.split(",").map(tag => tag.trim()).filter(tag => tag);
            for (const key in this._annotations) {
                const annotation = this._annotations[key];
                const tags = annotation.tags;
                let visible = tags.length === 0; // annotation is visible by default if no tags
                activeTags.forEach(tag => {
                    if (tags.indexOf(tag) >= 0) {
                        visible = true;
                    }
                });

                annotation.set("visible", visible);
                this.updateSprite(annotation);
            }
        }

        if (annotation) {
            if (ins.marker.changed) {
                annotation.set("marker", ins.marker.value);
            }
            if (ins.title.changed) {
                annotation.title = ins.title.value;
            }
            if (ins.lead.changed) {
                annotation.lead = ins.lead.value;
            }
            if (ins.tags.changed) {
               // annotation.set("tags", ins.tags.value.split(",").map(tag => tag.trim()).filter(tag => tag));
                annotation.tags = ins.tags.value.split(",").map(tag => tag.trim()).filter(tag => tag);
                this.emit<ITagUpdateEvent>({ type: "tag-update" });
            }
            if (ins.style.changed) {
                annotation.set("style", ins.style.getOptionText());
                this.createSprite(annotation);
            }
            if (ins.scale.changed) {
                annotation.set("scale", ins.scale.value);
            }
            if (ins.offset.changed) {
                annotation.set("offset", ins.offset.value);
            }
            if (ins.tilt.changed) {
                annotation.set("tilt", ins.tilt.value);
            }
            if (ins.azimuth.changed) {
                annotation.set("azimuth", ins.azimuth.value);
            }
            if (ins.color.changed) {
                annotation.set("color", ins.color.value.slice());
            }
            if (ins.image.changed) {
                annotation.set("imageUri", ins.image.value);
            }
            if (ins.article.changed) {
                const articles = this.articles;
                const article = articles && articles.getAt(ins.article.getValidatedValue() - 1);
                annotation.set("articleId", article ? article.id : "");
            }

            this.updateSprite(annotation);
            this.emit<IAnnotationsUpdateEvent>({ type: "annotation-update", annotation });
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

        this.off<IPointerEvent>("pointer-up", this.onPointerUp, this);
        this.system.off<IPointerEvent>("pointer-up", this.onSystemPointerUp, this);

        this.arManager.outs.isPresenting.off("value", this.handleARStateChange, this);
        this.language.outs.language.off("value", this.updateLanguage, this);

        this._viewports.forEach(viewport => viewport.off("dispose", this.onViewportDispose, this));
        this._viewports.clear();

        super.dispose();
    }

    getAnnotations()
    {
        return Object.keys(this._annotations).map(key => this._annotations[key]);
    }

    // getAnnotationById(id: string)
    // {
    //     return this._annotations[id];
    // }

    addAnnotation(annotation: Annotation)
    {
        this._annotations[annotation.id] = annotation;
        this.createSprite(annotation);

        // update langauges used in annotations
        Object.keys(annotation.data.titles).forEach( key => {
            this.language.addLanguage(ELanguageType[key]);
        });
        Object.keys(annotation.data.leads).forEach( key => {
            this.language.addLanguage(ELanguageType[key]);
        });

        this.changed = true;
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

            if(annotation.tags.length > 0) {
                this.emit<ITagUpdateEvent>({ type: "tag-update" });
            }
        }

        this.changed = true;
    }

    updateAnnotation(annotation: Annotation)
    {
        //this.updateSprite(annotation);
        this.changed = true;
    }

    toJSON()
    {
        const json = super.toJSON();

        const data = this.toData();
        if (data) {
            json.data = data;
        }

        return json;
    }

    fromJSON(json: any)
    {
        if (json.data) {
            this.fromData(json.data);
        }
    }

    toData(): IAnnotation[]
    {
        const keys = Object.keys(this._annotations);
        if (keys.length === 0) {
            return null;
        }

        return keys.map(key => this._annotations[key].toJSON());
    }

    fromData(data: IAnnotation[])
    {
        data.forEach(annotationJson => this.addAnnotation(new Annotation(annotationJson)));
        this.emit<ITagUpdateEvent>({ type: "tag-update" });
    }

    // Temporary until annotation scale implementation is resolved
    setXRScale(scale: number)
    {
        for (const key in this._annotations) {
            const annotation = this._annotations[key];
            if(annotation.get("style") === "Circle") {
                const sprite = this._sprites[annotation.id] as CircleSprite;
                if (sprite) {
                    sprite.xrScale = scale;
                }
            }
        }
    }

    protected handleARStateChange() {
        for (const key in this._annotations) {
            const annotation = this._annotations[key];
            const sprite = this._sprites[annotation.id];
            if (sprite instanceof StandardSprite || sprite instanceof ExtendedSprite) {
                (sprite as AnnotationSprite).isAdaptive = !this.arManager.outs.isPresenting.value;
            }
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

        const annotation = target && target.annotation;

        if (annotation) {
            if (ENV_DEVELOPMENT) {
                console.log(`CVAnnotationView.onPointerUp - title: ${annotation.title}, marker: ${annotation.data.marker}, id: ${annotation.id}`);
            }

            // click on annotation: activate annotation
            this.emit<IAnnotationClickEvent>({ type: "click", sprite: target, annotation });
            event.stopPropagation = true;
        }
    }

    protected onSystemPointerUp(event: IPointerEvent)
    {
        // click on model/background: deactivate active annotation
        if (!event.isDragging) {
            this.emit<IAnnotationClickEvent>({ type: "click", sprite: null, annotation: null });
        }
    }

    protected onViewportDispose(event: IViewportDisposeEvent)
    {
        const group = this.object3D as HTMLSpriteGroup;
        group.disposeHTMLElements(event.viewport.overlay);
    }

    protected onSpriteClick(event: IAnnotationClickEvent)
    {
        this.emit(event);
    }

    protected onSpriteLink(event: IAnnotationLinkEvent)
    {
        const reader = this.reader;
        if (reader) {
            this.reader.ins.articleId.setValue(event.annotation.data.articleId);
            this.reader.ins.enabled.setValue(true);
        }
    }

    protected createSprite(annotation: Annotation)
    {
        this.removeSprite(annotation);

        const sprite = AnnotationFactory.createInstance(annotation);

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

    protected updateLanguage()
    {
        const ins = this.ins;
        const annotation = this._activeAnnotation;

        // update sprites
        for (const key in this._annotations) {
            const annotation = this._annotations[key];
            const sprite = this._sprites[annotation.id];
            if (sprite) {
                sprite.update();
            }
        }

        // update properties
        ins.title.setValue(annotation ? annotation.title : "", true);
        ins.lead.setValue(annotation ? annotation.lead : "", true);
        ins.tags.setValue(annotation ? annotation.tags.join(", ") : "");
    }
}