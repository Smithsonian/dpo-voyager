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

import { types } from "@ff/graph/propertyTypes";
import { IComponentEvent } from "@ff/graph/Node";

import NVItem from "../../explorer/nodes/NVItem";
import CVAnnotations, { IActiveAnnotationEvent } from "../../explorer/components/CVAnnotations";

import AnnotationsTaskView from "../ui/AnnotationsTaskView";
import CVTask, { ITaskUpdateEvent } from "./CVTask";
import { IPointerEvent } from "@ff/scene/RenderView";
import CVModel from "../../core/components/CVModel";
import { IActiveItemEvent } from "../../explorer/components/CVPresentationController";
import Annotation from "../../explorer/models/Annotation";
import uniqueId from "@ff/core/uniqueId";

////////////////////////////////////////////////////////////////////////////////

const _mat4 = new THREE.Matrix4();

export enum EAnnotationsTaskMode { Off, Move, Create }

const _inputs = {
    mode: types.Enum("Mode", EAnnotationsTaskMode, EAnnotationsTaskMode.Off),
};

export default class CVAnnotationsTask extends CVTask
{
    static readonly text: string = "Annotations";
    static readonly icon: string = "comment";

    ins = this.addInputs<CVTask, typeof _inputs>(_inputs);

    private _activeAnnotations: CVAnnotations = null;

    get activeAnnotations() {
        return this._activeAnnotations;
    }
    set activeAnnotations(component: CVAnnotations) {
        if (component !== this._activeAnnotations) {
            this._activeAnnotations = component;
            this.emitUpdateEvent();
        }
    }

    createView()
    {
        return new AnnotationsTaskView(this);
    }

    activate()
    {
        super.activate();

        this.selectionController.selectedComponents.on(CVAnnotations, this.onSelectAnnotations, this);
        this.system.on<IPointerEvent>("pointer-up", this.onPointerUp, this);
    }

    deactivate()
    {
        this.selectionController.selectedComponents.off(CVAnnotations, this.onSelectAnnotations, this);
        this.system.off<IPointerEvent>("pointer-up", this.onPointerUp, this);

        super.deactivate();
    }

    createAnnotation(position: number[], direction: number[])
    {
        const annotations = this.activeAnnotations;

        if (annotations) {
            const annotation = new Annotation();
            annotation.position = position;
            annotation.direction = direction;
            annotations.addAnnotation(annotation);
            annotations.activeAnnotation = annotation;
            //this.emitUpdateEvent();
        }
    }

    moveAnnotation(position: number[], direction: number[])
    {
        const annotations = this.activeAnnotations;

        if (annotations) {
            const annotation = annotations.activeAnnotation;
            annotation.position = position;
            annotation.direction = direction;

            annotations.annotationUpdated(annotation);
            this.emitUpdateEvent();
        }
    }

    removeAnnotation()
    {
        const annotations = this.activeAnnotations;

        if (annotations) {
            const annotation = annotations.activeAnnotation;
            if (annotation) {
                annotations.removeAnnotation(annotation);
                //this.emitUpdateEvent();
            }
        }
    }

    protected onPointerUp(event: IPointerEvent)
    {
        if (event.isDragging) {
            return;
        }

        const model = this.activeAnnotations.getComponent(CVModel);

        // user clicked on model
        if (event.component === model) {

            // get click position and normal in annotation space = pose transform * model space
            const matrix = model.object3D.matrix;
            _mat4.getInverse(matrix).transpose();
            const position = event.view.pickPosition(event).applyMatrix4(matrix).toArray();
            const normal = event.view.pickNormal(event).applyMatrix4(_mat4).toArray();

            const mode = this.ins.mode.getValidatedValue();

            if (mode === EAnnotationsTaskMode.Create) {
                this.createAnnotation(position, normal);
            }
            else if (mode === EAnnotationsTaskMode.Move) {
                this.moveAnnotation(position, normal);

            }
        }
    }

    protected onActiveItem(event: IActiveItemEvent)
    {
        const prevAnnotations = event.previous ? event.previous.annotations : null;
        const nextAnnotations = event.next ? event.next.annotations : null;

        if (prevAnnotations) {
            prevAnnotations.off<IActiveAnnotationEvent>("active-annotation", this.emitUpdateEvent, this);
        }
        if (nextAnnotations) {
            nextAnnotations.on<IActiveAnnotationEvent>("active-annotation", this.emitUpdateEvent, this);
            this.selectionController.selectComponent(nextAnnotations);
        }

        this.activeAnnotations = nextAnnotations;
    }

    protected onSelectAnnotations(event: IComponentEvent<CVAnnotations>)
    {
        if (event.add && event.object.node instanceof NVItem) {
            this.presentationController.activeItem = event.object.node;
        }
    }
}