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
import { IActiveDocumentEvent } from "@ff/graph/components/CDocumentManager";

import { IPointerEvent } from "@ff/scene/RenderView";

import CVModel from "../../core/components/CVModel";
import CVAnnotations, { IAnnotationsUpdateEvent } from "../../explorer/components/CVAnnotations";
import Annotation from "../../explorer/models/Annotation";
import { IActiveItemEvent } from "../../explorer/components/CVItemManager";
import NVItem from "../../explorer/nodes/NVItem";

import AnnotationsTaskView from "../ui/AnnotationsTaskView";
import CVTask from "./CVTask";
import CVDocument from "../../explorer/components/CVDocument";


////////////////////////////////////////////////////////////////////////////////

const _vec3 = new THREE.Vector3();
const _mat4 = new THREE.Matrix4();
const _mat3 = new THREE.Matrix3();

export enum EAnnotationsTaskMode { Off, Move, Create }

const _inputs = {
    mode: types.Enum("Mode", EAnnotationsTaskMode, EAnnotationsTaskMode.Off),
};

export default class CVAnnotationsTask extends CVTask
{
    static readonly typeName: string = "CVAnnotationsTask";

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

    activateTask()
    {
        super.activateTask();

        this.selectionController.selectedComponents.on(CVAnnotations, this.onSelectAnnotations, this);
        this.system.on<IPointerEvent>("pointer-up", this.onPointerUp, this);

        // disable selection brackets
        const prop = this.selectionController.ins.viewportBrackets;
        this._bracketsVisible = prop.value;
        prop.setValue(false);
    }

    deactivateTask()
    {
        // restore selection brackets visibility
        this.selectionController.ins.viewportBrackets.setValue(this._bracketsVisible);

        this.selectionController.selectedComponents.off(CVAnnotations, this.onSelectAnnotations, this);
        this.system.off<IPointerEvent>("pointer-up", this.onPointerUp, this);

        super.deactivateTask();
    }

    update()
    {
        super.update();

        if (this.ins.mode.changed) {
            this.emitUpdateEvent();
        }

        return false;
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
            _vec3.setScalar(1 / model.outs.unitScale.value);
            _mat4.copy(model.object3D.matrix).scale(_vec3);
            _mat3.getNormalMatrix(_mat4);
            const position = event.view.pickPosition(event).applyMatrix4(_mat4).toArray();
            const normal = event.view.pickNormal(event).applyMatrix3(_mat3).toArray();

            const mode = this.ins.mode.getValidatedValue();

            if (mode === EAnnotationsTaskMode.Create) {
                this.createAnnotation(position, normal);
            }
            else if (mode === EAnnotationsTaskMode.Move) {
                this.moveAnnotation(position, normal);
            }
        }
    }

    protected onActiveDocument(event: IActiveDocumentEvent)
    {
        const prevDocument = event.previous as CVDocument;
        const nextDocument = event.next as CVDocument;

        if (prevDocument) {
            prevDocument.features.grid.ins.visible.setValue(this._gridVisible);
            prevDocument.scene.ins.annotations.setValue(this._annotationsVisible);
        }
        if (nextDocument) {
            let prop = nextDocument.features.grid.ins.visible;
            this._gridVisible = prop.value;
            prop.setValue(false);

            prop = nextDocument.scene.ins.annotations;
            this._annotationsVisible = prop.value;
            prop.setValue(true);
        }
    }

    protected onActiveItem(event: IActiveItemEvent)
    {
        const prevAnnotations = event.previous ? event.previous.annotations : null;
        const nextAnnotations = event.next ? event.next.annotations : null;

        if (prevAnnotations) {
            prevAnnotations.off<IAnnotationsUpdateEvent>("update", this.emitUpdateEvent, this);
        }
        if (nextAnnotations) {
            nextAnnotations.on<IAnnotationsUpdateEvent>("update", this.emitUpdateEvent, this);
            this.selectionController.selectComponent(nextAnnotations);
        }

        this.activeAnnotations = nextAnnotations;
    }

    protected onSelectAnnotations(event: IComponentEvent<CVAnnotations>)
    {
        const node = event.object.node;

        if (event.add && node instanceof NVItem) {
            this.itemManager.activeItem = node;
        }
    }
}