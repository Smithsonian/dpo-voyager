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

import * as helpers from "@ff/three/helpers";

import { types } from "@ff/graph/propertyTypes";
import { IComponentEvent } from "@ff/graph/Node";

import { IPointerEvent } from "@ff/scene/RenderView";

import CVModel_old from "../../core/components/CVModel_old";
import CVAnnotations_old, { IAnnotationsUpdateEvent } from "../../explorer/components/CVAnnotations_old";
import Annotation from "../../explorer/models/Annotation";
import NVItem_old from "../../explorer/nodes/NVItem_old";

import AnnotationsTaskView from "../ui/AnnotationsTaskView";
import CVTask from "./CVTask";

////////////////////////////////////////////////////////////////////////////////

const _vec3a = new THREE.Vector3();
const _vec3b = new THREE.Vector3();
const _quat = new THREE.Quaternion();
const _mat4 = new THREE.Matrix4();
const _mat3 = new THREE.Matrix3();

export enum EAnnotationsTaskMode { Off, Move, Create }

export default class CVAnnotationsTask extends CVTask
{
    static readonly typeName: string = "CVAnnotationsTask";

    static readonly text: string = "Annotations";
    static readonly icon: string = "comment";

    protected static readonly ins = {
        mode: types.Enum("Mode", EAnnotationsTaskMode, EAnnotationsTaskMode.Off),
    };

    ins = this.addInputs<CVTask, typeof CVAnnotationsTask.ins>(CVAnnotationsTask.ins);

    private _activeAnnotations: CVAnnotations_old = null;


    get activeAnnotations() {
        return this._activeAnnotations;
    }
    set activeAnnotations(annotations: CVAnnotations_old) {
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

        this.selectionController.selectedComponents.on(CVAnnotations_old, this.onSelectAnnotations, this);
        this.system.on<IPointerEvent>("pointer-up", this.onPointerUp, this);
    }

    deactivateTask()
    {
        this.selectionController.selectedComponents.off(CVAnnotations_old, this.onSelectAnnotations, this);
        this.system.off<IPointerEvent>("pointer-up", this.onPointerUp, this);

        super.deactivateTask();
    }

    create()
    {
        super.create();

        const configuration = this.configuration;
        configuration.annotationsVisible = true;
        configuration.gridVisible = false;
        configuration.interfaceVisible = true;
        configuration.bracketsVisible = false;
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
        // do not handle event if user is dragging (the camera)
        if (event.isDragging) {
            return;
        }

        const model = this.activeAnnotations.getComponent(CVModel_old);

        // user clicked on model
        if (event.component === model) {

            // get click position and normal in annotation space = pose transform * model space
            _vec3a.fromArray(model.ins.position.value);
            helpers.degreesToQuaternion(model.ins.rotation.value, CVModel_old.rotationOrder, _quat);
            _vec3b.setScalar(1);
            _mat4.compose(_vec3a, _quat, _vec3b);
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

    protected onActiveItem(previous: NVItem_old, next: NVItem_old)
    {
        const prevAnnotations = previous ? previous.annotations : null;
        const nextAnnotations = next ? next.annotations : null;

        if (prevAnnotations) {
            prevAnnotations.off<IAnnotationsUpdateEvent>("update", this.emitUpdateEvent, this);
        }
        if (nextAnnotations) {
            nextAnnotations.on<IAnnotationsUpdateEvent>("update", this.emitUpdateEvent, this);
            this.selectionController.selectComponent(nextAnnotations);
        }

        this.activeAnnotations = nextAnnotations;
    }

    protected onSelectAnnotations(event: IComponentEvent<CVAnnotations_old>)
    {
        const node = event.object.node;

        if (event.add && node instanceof NVItem_old) {
            this.itemManager.activeItem = node;
        }
    }

    protected emitUpdateEvent()
    {
        this.emit("update");
    }
}