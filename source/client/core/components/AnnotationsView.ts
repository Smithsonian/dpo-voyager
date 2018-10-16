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
import { ComponentTracker } from "@ff/core/ecs/Component";

import AnnotationView from "../views/AnnotationView";
import AnnotationFactory from "../views/AnnotationFactory";

import { IPickable, IPickResult, IViewportPointerEvent, IViewportTriggerEvent } from "./PickManip";
import Annotations, { IAnnotation, IAnnotationsChangeEvent } from "./Annotations";
import Model from "./Model";
import Object3D from "./Object3D";

////////////////////////////////////////////////////////////////////////////////


export default class AnnotationsView extends Object3D implements IPickable
{
    static readonly type: string = "AnnotationsView";

    protected annotationsTracker: ComponentTracker<Annotations> = null;
    protected modelTracker: ComponentTracker<Model> = null;

    protected factory: AnnotationFactory;
    protected views: Dictionary<AnnotationView> = {};
    protected activeView: AnnotationView = null;

    create()
    {
        super.create();

        this.object3D = new THREE.Group();
        this.object3D.updateMatrix();

        this.modelTracker = this.trackComponent(Model, model => {
            model.object3D.add(this.object3D);
        }, model => {
            model.object3D.remove(this.object3D);
        });

        this.annotationsTracker = this.trackComponent(Annotations, component => {
            component.getArray().forEach(annotation => this.addView(annotation));
            component.on("change", this.onAnnotationsChange, this);
        }, component => {
            component.off("change", this.onAnnotationsChange, this);
            component.getArray().forEach(annotation => this.removeView(annotation));
        });
    }

    setFactory(factory: AnnotationFactory)
    {
        this.factory = factory;
    }

    onPointer(event: IViewportPointerEvent, pickInfo: IPickResult)
    {
        if (event.isPrimary) {
            if (event.type === "down") {
                const view = this.findViewByObject(pickInfo.object);

                if (view) {
                    this.activeView = view;
                }
            }
            else if (event.type === "up") {
                if (this.activeView) {
                    console.log(this.activeView.annotation.title);
                }

                this.activeView = null;
            }
        }

        return false;
    }

    onTrigger(event: IViewportTriggerEvent, pickInfo: IPickResult)
    {
        return false;
    }

    protected onAnnotationsChange(event: IAnnotationsChangeEvent)
    {
        if (event.what === "add") {
            this.addView(event.annotation);
        }
        else if (event.what === "remove") {
            this.removeView(event.annotation);
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