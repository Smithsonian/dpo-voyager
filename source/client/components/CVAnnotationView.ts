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
import HTMLSpriteGroup from "@ff/three/HTMLSpriteGroup";

import CObject3D, { IPointerEvent, IRenderContext } from "@ff/scene/components/CObject3D";
import CRenderer from "@ff/scene/components/CRenderer";

import CVModel2 from "./CVModel2";
import CVMeta from "./CVMeta";
import CVReader from "./CVReader";
import unitScaleFactor from "../utils/unitScaleFactor";

import { IAnnotation } from "client/schema/model";
import Annotation from "../models/Annotation";

import AnnotationSprite, { IAnnotationClickEvent, IAnnotationLinkEvent } from "../annotations/AnnotationSprite";
import AnnotationFactory from "../annotations/AnnotationFactory";

import "../annotations/StandardSprite";
import "../annotations/ExtendedSprite";
import "../annotations/CircleSprite";
import CVARManager from "./CVARManager";
import CVLanguageManager from "./CVLanguageManager";
import { ELanguageType, EUnitType } from "client/schema/common";
import CVAssetReader from "./CVAssetReader";
import CVAudioManager from "./CVAudioManager";
import CVAssetManager from "./CVAssetManager";
import CVSnapshots from "./CVSnapshots";
import CPulse from "client/../../libs/ff-graph/source/components/CPulse";
import CVScene from "./CVScene";

////////////////////////////////////////////////////////////////////////////////

export { Annotation, IAnnotationClickEvent };

export interface IAnnotationsUpdateEvent extends ITypedEvent<"annotation-update">
{
    annotation: Annotation;
}

export interface ITagUpdateEvent extends ITypedEvent<"tag-update">
{
}

export interface IActiveTagUpdateEvent extends ITypedEvent<"active-tag-update">
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
        imageCredit: types.String("Image.Credit"),
        imageAltText: types.String("Image.AltText"),
        audioId: types.String("Annotation.AudioID"),
        tilt: types.Number("Annotation.Tilt"),
        azimuth: types.Number("Annotation.Azimuth"),
        color: types.ColorRGB("Annotation.Color"),
    };

    ins = this.addInputs<CObject3D, typeof CVAnnotationView.ins>(CVAnnotationView.ins);

    private _activeAnnotation: Annotation = null;
    private _annotations: Dictionary<Annotation> = {};

    private _viewports = new Set<Viewport>();
    private _sprites: Dictionary<AnnotationSprite> = {};

    private _truncateLock = false;
    private _activeView = false;
    private _hasNewActiveTags = false;

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
    protected get audio() {
        return this.getGraphComponent(CVAudioManager, true);
    }
    protected get snapshots() {
        return this.getGraphComponent(CVSnapshots, true);
    }
    protected get articles() {
        const meta = this.meta;
        return meta ? meta.articles : null;
    }
    protected get arManager() {
        return this.system.getMainComponent(CVARManager);
    }
    protected get assetManager() {
        return this.system.getMainComponent(CVAssetManager);
    }
    protected get renderer() {
        return this.getMainComponent(CRenderer);
    }
    protected get assetReader() {
        return this.getMainComponent(CVAssetReader);
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

                // need to lock truncation checking during a tween
                if(this._activeView) {
                    this._truncateLock = true;
                    this._activeView = false;
                }
            }

            const ins = this.ins;
            ins.marker.setValue(annotation ? annotation.data.marker : "", true);
            ins.title.setValue(annotation ? annotation.title : "", true);
            ins.lead.setValue(annotation ? annotation.lead : "", true);
            ins.tags.setValue(annotation ? annotation.tags.join(", ") : "", true);
            ins.style.setOption(annotation ? annotation.data.style : AnnotationFactory.defaultTypeName, true);
            ins.scale.setValue(annotation ? annotation.data.scale * 100 * unitScaleFactor(this.model.ins.localUnits.getValidatedValue(), EUnitType.m) : 1, true);
            ins.offset.setValue(annotation ? annotation.data.offset * 100 * unitScaleFactor(this.model.ins.localUnits.getValidatedValue(), EUnitType.m) : 0, true);
            ins.tilt.setValue(annotation ? annotation.data.tilt : 0, true);
            ins.azimuth.setValue(annotation ? annotation.data.azimuth : 0, true);
            ins.color.setValue(annotation ? annotation.data.color.slice() : [ 1, 1, 1 ], true);

            const articles = this.reader.articles;
            if (articles.length) {
                const names = articles.map(entry => entry.article.title);
                names.unshift("(none)");
                ins.article.setOptions(names);
                const article = annotation ? articles.find((entry) => entry.article.id === annotation.data.articleId) : null;
                ins.article.setValue(article ? articles.indexOf(article) + 1 : 0, true);
            }
            else {
                ins.article.setOptions([ "(none)" ]);
                ins.article.setValue(0);
            }

            ins.audioId.setValue(annotation ? annotation.data.audioId : null, true);
            ins.image.setValue(annotation ? annotation.data.imageUri : "", true);
            ins.imageCredit.setValue(annotation ? annotation.imageCredit : "", true);
            ins.imageAltText.setValue(annotation ? annotation.imageAltText : "", true);

            this.emit<IAnnotationsUpdateEvent>({ type: "annotation-update", annotation });
        }

    }

    get hasAnnotations() {
        return Object.keys(this._annotations).length > 0;
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
                        this._hasNewActiveTags = true;
                    }
                });

                annotation.set("visible", visible);
                this.updateSprite(annotation);
            }
        }
        if (ins.visible.changed) {
            (object3D as HTMLSpriteGroup).setVisible(ins.visible.value);
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
                annotation.tags = ins.tags.value.split(",").map(tag => tag.trim()).filter(tag => tag);
                this.emit<ITagUpdateEvent>({ type: "tag-update" });
            }
            if (ins.style.changed) {
                annotation.set("style", ins.style.getOptionText());
                this.createSprite(annotation);
            }
            if (ins.scale.changed) {
                annotation.set("scale", ins.scale.value * unitScaleFactor(EUnitType.m, this.model.ins.localUnits.getValidatedValue()) * 0.01);
            }
            if (ins.offset.changed) {
                annotation.set("offset", ins.offset.value * unitScaleFactor(EUnitType.m, this.model.ins.localUnits.getValidatedValue()) * 0.01);
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
            if (ins.imageCredit.changed) {
                annotation.imageCredit =  ins.imageCredit.value;
            }
            if (ins.imageAltText.changed) {
                annotation.imageAltText =  ins.imageAltText.value;
            }
            if (ins.article.changed) {
                const articles = this.reader.articles;
                const entry = articles && articles[ins.article.getValidatedValue() - 1];
                annotation.set("articleId", entry ? entry.article.id : "");
            }
            if (ins.audioId.changed) {
                annotation.set("audioId", ins.audioId.value);
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

        // Handle locking truncation for view animation only after 
        // the sprite has a chance to do an initial update.
        if(this._truncateLock) {
            const annotation = this.activeAnnotation.data;
            const sprite = this._sprites[annotation.id] as AnnotationSprite;
            if(this.snapshots.outs.tweening.value) {
                sprite.isAnimating = true;
                this.snapshots.outs.tweening.once("value", () => { sprite.isAnimating = false;}, this);
            }
            this._truncateLock = false;
        }

        // Handle active tag updates
        if(this._hasNewActiveTags) {
            this.emit<IActiveTagUpdateEvent>({ type: "active-tag-update" });
            this._hasNewActiveTags = false;
        }
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

    updateAnnotation(annotation: Annotation, forceSprite?: boolean)
    {
        if(forceSprite) {
            this.updateSprite(annotation);
        }
        
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
        const language = this.language.outs.language.value;
        data.forEach(annotationJson => {
            let a = new Annotation(annotationJson);
            a.language = language;
            this.addAnnotation(a);
        });
        this.emit<ITagUpdateEvent>({ type: "tag-update" });
    }

    protected handleARStateChange() {
        for (const key in this._annotations) {
            const annotation = this._annotations[key];
            const sprite = this._sprites[annotation.id];
            (sprite as AnnotationSprite).isAdaptive = !this.arManager.outs.isPresenting.value;
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

    protected onSpriteClick(event: any)
    {
        this.emit(event);

        // start view animation if it exists
        const annotation = event.annotation;
        if(annotation && annotation.data.viewId.length && !this.arManager.outs.isPresenting.value) {
            this.normalizeViewOrbit(annotation.data.viewId);

            // If activeAnnotation is being tracked, make sure it is set
            const activeIdx = this.snapshots.getTargetProperties().findIndex(prop => prop.name == "ActiveId");
            if(activeIdx >= 0) {
                const viewState = this.snapshots.getState(annotation.data.viewId);
                viewState.values[activeIdx] = annotation.data.id;
            }
            
            const pulse = this.getMainComponent(CPulse);
            this.snapshots.tweenTo(annotation.data.viewId, pulse.context.secondsElapsed);
            this._activeView = true;
        }
    }

    protected onSpriteLink(event: any)
    {
        const reader = this.reader;
        if (reader) {
            this.reader.ins.articleId.setValue(event.annotation.data.articleId);
            this.reader.ins.enabled.setValue(true);
            this.reader.ins.focus.setValue(true);
        }
    }

    protected createSprite(annotation: Annotation)
    {
        this.removeSprite(annotation);

        // TODO: Combine when font loading is centralized
        const sprite = AnnotationFactory.createInstance(annotation);

        sprite.addEventListener("click", this.onSpriteClick);
        sprite.addEventListener("link", this.onSpriteLink);

        sprite.assetManager = this.assetManager;
        sprite.audioManager = this.audio;

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
        // only update language for model annotations
        if(!this.getComponent(CVModel2, true)) {
            return;
        }

        const ins = this.ins;
        const annotation = this._activeAnnotation;
        const language = this.language;

        this.getAnnotations().forEach( annotation => {
            annotation.language = language.outs.language.value;
        });
        ins.activeTags.set();

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
        ins.imageCredit.setValue(annotation ? annotation.imageCredit : "", true);
        ins.imageAltText.setValue(annotation ? annotation.imageAltText : "", true);

        // update article list
        const names = this.reader.articles.map(entry => entry.article.title);
        names.unshift("(none)");
        ins.article.setOptions(names);
    }

    // helper function to bring saved state orbit into alignment with current view orbit
    protected normalizeViewOrbit(viewId: string) {
        const orbitIdx = this.snapshots.getTargetProperties().findIndex(prop => prop.name == "Orbit");
        const viewState = this.snapshots.getState(viewId);
        const currentOrbit = this.snapshots.getCurrentValues()[orbitIdx];
        let angleOffset = 0;
        currentOrbit.forEach((n, i) => {
            const mult = Math.round((n-viewState.values[orbitIdx][i])/360);
            viewState.values[orbitIdx][i] += 360*mult;
            angleOffset += Math.abs(n-viewState.values[orbitIdx][i]);
        });

        // Factor offset into duration calculation
        const scene = this.getGraphComponent(CVScene);
        const bounds = scene.outs.boundingRadius.value;
        const offsetIdx = this.snapshots.getTargetProperties().findIndex(prop => prop.name == "Offset");
        const currentOffset = this.snapshots.getCurrentValues()[offsetIdx];
        const offset = viewState.values[offsetIdx];
        const dist = Math.sqrt(Math.pow(offset[0]-currentOffset[0],2)+Math.pow(offset[1]-currentOffset[1],2)+Math.pow(offset[2]-currentOffset[2],2));

        viewState.duration = Math.min(Math.max(angleOffset/180, dist/bounds, 0.3),1.5); // max 1.5s, min 0.3s
    }
}