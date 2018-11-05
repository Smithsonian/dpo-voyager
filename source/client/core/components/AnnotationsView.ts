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

import Annotations, { IAnnotation, IAnnotationsChangeEvent, Vector3 } from "./Annotations";
import Model from "./Model";

import AnnotationView from "../views/AnnotationView";

import PickManip, { IPickManipPickEvent } from "./PickManip";
import AnnotationsController from "./AnnotationsController";
import Object3D from "./Object3D";

////////////////////////////////////////////////////////////////////////////////

export default class AnnotationsView extends Object3D
{
    static readonly type: string = "AnnotationsView";

    protected annotations: Annotations = null;
    protected model: Model = null;

    protected views: Dictionary<AnnotationView> = {};

    protected pickManip: PickManip = null;
    protected controller: AnnotationsController = null;

    constructor(id?: string)
    {
        super(id);
        this.addEvents("tap-model", "tap-annotation");

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
        this.pickManip.on("down", this.onPick, this);

        this.controller = this.getComponent(AnnotationsController, true);
    }

    dispose()
    {
        this.model.object3D.remove(this.object3D);

        this.annotations.off("change", this.onAnnotationsChange, this);
        this.annotations.getArray().forEach(annotation => this.removeView(annotation));

        this.pickManip.off("down", this.onPick, this);
    }

    protected onPick(event: IPickManipPickEvent)
    {
        if (event.component === this) {
            // find picked annotation view
            const view = this.findViewByObject(event.object);
            if (view) {
                this.controller.actions.select(this.annotations, view.annotation);
                return;
            }
        }

        // clear annotation selection
        this.controller.actions.select(null, null);
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
            case "move":
                this.updateView(event.annotation);
                break;
        }
    }

    protected addView(annotation: IAnnotation)
    {
        const view = new AnnotationView(annotation);
        this.views[view.id] = view;
        this.object3D.add(view);
    }

    protected removeView(annotation: IAnnotation)
    {
        const view = this.findViewByAnnotation(annotation);
        this.object3D.remove(view);
        delete this.views[view.id];
    }

    protected updateView(annotation: IAnnotation)
    {
        const view = this.findViewByAnnotation(annotation);
        view.update();
    }

    protected findViewByAnnotation(annotation: IAnnotation): AnnotationView | null
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

    protected findViewByObject(object: THREE.Object3D): AnnotationView | null
    {
        let view;
        while(object && (view = this.views[object.id]) === undefined) {
            object = object.parent;
        }

        return view;
    }
}