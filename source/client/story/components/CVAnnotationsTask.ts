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
import { IPointerEvent } from "@ff/scene/RenderView";

import CVModel from "../../core/components/CVModel";
import { IActiveItemEvent, IActivePresentationEvent } from "../../explorer/components/CVPresentationController";
import NVItem from "../../explorer/nodes/NVItem";
import CVAnnotations, { IActiveAnnotationEvent } from "../../explorer/components/CVAnnotations";
import Annotation from "../../explorer/models/Annotation";

import AnnotationsTaskView from "../ui/AnnotationsTaskView";
import CVTask from "./CVTask";

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
    private _bracketsVisible = false;
    private _annotationsVisible = false;
    private _gridVisible = false;


    get activeAnnotations() {
        return this._activeAnnotations;
    }
    set activeAnnotations(annotations: CVAnnotations) {
        if (annotations !== this._activeAnnotations) {
            this._activeAnnotations = annotations;
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

        // disable selection brackets
        const prop = this.selectionController.ins.viewportBrackets;
        this._bracketsVisible = prop.value;
        prop.setValue(false);
    }

    deactivate()
    {
        // restore selection brackets visibility
        this.selectionController.ins.viewportBrackets.setValue(this._bracketsVisible);

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
        }
    }

    moveAnnotation(position: number[], direction: number[])
    {
        const annotations = this.activeAnnotations;
        if (annotations) {
            const annotation = annotations.activeAnnotation;

            if (annotation) {
                annotation.position = position;
                annotation.direction = direction;

                annotations.updateAnnotation(annotation);
                this.emitUpdateEvent();
            }
        }
    }

    removeAnnotation()
    {
        const annotations = this.activeAnnotations;

        if (annotations) {
            const annotation = annotations.activeAnnotation;
            if (annotation) {
                annotations.removeAnnotation(annotation);
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

    protected onActivePresentation(event: IActivePresentationEvent)
    {
        const prevPresentation = event.previous;
        const nextPresentation = event.next;

        if (prevPresentation) {
            prevPresentation.setup.homeGrid.ins.visible.setValue(this._gridVisible);
            prevPresentation.scene.ins.annotations.setValue(this._annotationsVisible);
        }
        if (nextPresentation) {
            let prop = nextPresentation.setup.homeGrid.ins.visible;
            this._gridVisible = prop.value;
            prop.setValue(false);

            prop = nextPresentation.scene.ins.annotations;
            this._annotationsVisible = prop.value;
            prop.setValue(true);
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