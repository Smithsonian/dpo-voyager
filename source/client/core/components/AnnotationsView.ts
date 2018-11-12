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

import { Dictionary } from "@ff/core/types";

import Annotations, { IAnnotation, IAnnotationsChangeEvent } from "./Annotations";
import Model from "./Model";

import AnnotationObject from "../views/AnnotationObject";
import AnnotationCone from "../views/AnnotationCone";
import AnnotationHTML from "../views/AnnotationHTML";

import PickManip, { IPickManipPickEvent } from "./PickManip";
import AnnotationsController, { ISelectAnnotationEvent } from "./AnnotationsController";
import Object3D from "./Object3D";

////////////////////////////////////////////////////////////////////////////////

export default class AnnotationsView extends Object3D
{
    static readonly type: string = "AnnotationsView";

    protected annotations: Annotations = null;
    protected model: Model = null;

    protected views: Dictionary<AnnotationObject> = {};
    protected selectedView: AnnotationObject = null;

    protected pickManip: PickManip = null;
    protected controller: AnnotationsController = null;

    constructor(id?: string)
    {
        super(id);

        this.object3D = new THREE.Group();
        this.object3D.updateMatrix();
    }

    create()
    {
        super.create();

        this.model = this.getComponent(Model);
        this.model.object3D.add(this.object3D);

        this.annotations = this.getComponent(Annotations);
        this.annotations.getArray().forEach(annotation => this.addView(annotation));
        this.annotations.on("change", this.onAnnotationsChange, this);

        this.pickManip = this.getComponent(PickManip, true);
        this.pickManip.on("pick", this.onPick, this);

        this.controller = this.getComponent(AnnotationsController, true);
        this.controller.on("select", this.onControllerSelect, this);
    }

    postRender(context)
    {
        Object.keys(this.views).forEach(key => this.views[key].render(context));
    }

    dispose()
    {
        this.annotations.off("change", this.onAnnotationsChange, this);
        this.annotations.getArray().forEach(annotation => this.removeView(annotation));

        this.pickManip.off("pick", this.onPick, this);
        this.controller.off("select", this.onControllerSelect, this);

        this.model.object3D.remove(this.object3D);

        super.dispose();
    }

    getModelBoundingBox()
    {
        return this.model.getBoundingBox();
    }

    setVisible(visible: boolean)
    {

    }

    onClick(view: AnnotationObject)
    {
        this.controller.actions.selectAnnotation(this.annotations, view.annotation);
    }

    protected onPick(event: IPickManipPickEvent)
    {
        if (event.component === this) {
            // find picked annotation view
            const view = this.findViewByObject(event.object);
            if (view) {
                this.controller.actions.selectAnnotation(this.annotations, view.annotation);
                return;
            }
        }

        // clear annotation selection
        this.controller.actions.selectAnnotation(null, null);
    }

    protected onControllerSelect(event: ISelectAnnotationEvent)
    {
        const view = this.findViewByAnnotation(event.annotation);
        if (view !== this.selectedView) {
            if (this.selectedView) {
                this.selectedView.setSelected(false);
            }
            this.selectedView = view;
            if (view) {
                view.setSelected(true);
            }
        }
    }

    protected onAnnotationsChange(event: IAnnotationsChangeEvent)
    {
        switch(event.what) {
            case "add":
                this.addView(event.annotation);
                break;
            case "remove":
                this.removeView(event.annotation);
                break;
            case "update":
                this.updateView(event.annotation);
                break;
        }
    }

    protected addView(annotation: IAnnotation)
    {
        const view = new AnnotationHTML(this, annotation); // new AnnotationCone(annotation);
        this.views[view.id] = view;
        this.object3D.add(view);
    }

    protected removeView(annotation: IAnnotation)
    {
        const view = this.findViewByAnnotation(annotation);
        this.object3D.remove(view);
        delete this.views[view.id];
        view.dispose();
    }

    protected updateView(annotation: IAnnotation)
    {
        if (annotation) {
            const view = this.findViewByAnnotation(annotation);
            view.update();
        }
        else {
            Object.keys(this.views).forEach(key => this.views[key].update());
        }
    }

    protected findViewByAnnotation(annotation: IAnnotation): AnnotationObject | null
    {
        const views = this.views;
        const keys = Object.keys(views);
        for (let i = 0, n = keys.length; i < n; ++i) {
            const view = views[keys[i]];
            if (view.annotation === annotation) {
                return view;
            }
        }

        return null;
    }

    protected findViewByObject(object: THREE.Object3D): AnnotationObject | null
    {
        let view;
        while(object && (view = this.views[object.id]) === undefined) {
            object = object.parent;
        }

        return view;
    }
}