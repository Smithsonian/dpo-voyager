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

import * as THREE from "three";

import * as helpers from "@ff/three/helpers";

import { Node, types } from "@ff/graph/Component";

import { IPointerEvent } from "@ff/scene/RenderView";

import Annotation from "../models/Annotation";

import NVNode from "../nodes/NVNode";

import CVDocument from "./CVDocument";
import CVTask from "./CVTask";
import CVModel2 from "./CVModel2";
import CVAnnotationView, { IAnnotationsUpdateEvent } from "./CVAnnotationView";

import AnnotationsTaskView from "../ui/story/AnnotationsTaskView";
import CVScene from "client/components/CVScene";

////////////////////////////////////////////////////////////////////////////////

const _position = new THREE.Vector3();
const _scaling = new THREE.Vector3();
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

    private _activeAnnotations: CVAnnotationView = null;
    private _defaultScale = 1;

    constructor(node: Node, id: string)
    {
        super(node, id);

        const configuration = this.configuration;
        configuration.annotationsVisible = true;
        configuration.gridVisible = false;
        configuration.interfaceVisible = true;
        configuration.bracketsVisible = false;
    }

    get activeAnnotations() {
        return this._activeAnnotations;
    }
    set activeAnnotations(annotations: CVAnnotationView) {
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
        this.startObserving();
        super.activateTask();

        //this.selection.selectedComponents.on(CVAnnotationView, this.onSelectAnnotations, this);
        //this.system.on<IPointerEvent>("pointer-up", this.onPointerUp, this);
    }

    deactivateTask()
    {
        //this.selection.selectedComponents.off(CVAnnotationView, this.onSelectAnnotations, this);
        //this.system.off<IPointerEvent>("pointer-up", this.onPointerUp, this);

        this.stopObserving();
        super.deactivateTask();
    }

    update(context)
    {
        if (this.ins.mode.changed) {
            this.emitUpdateEvent();
        }

        return true;
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

        const annotations = this.activeAnnotations;
        if (!annotations) {
            return;
        }

        const model = annotations.getComponent(CVModel2);

        // user clicked on model
        if (event.component === model) {

            // get click position and normal in annotation space = pose transform * model space
            _position.fromArray(model.ins.position.value);
            helpers.degreesToQuaternion(model.ins.rotation.value, CVModel2.rotationOrder, _quat);
            _scaling.setScalar(1);
            _mat4.compose(_position, _quat, _scaling);
            _mat3.getNormalMatrix(_mat4);

            const position = event.view.pickPosition(event, model.localBoundingBox).applyMatrix4(_mat4).toArray();
            const normal = event.view.pickNormal(event).applyMatrix3(_mat3).toArray();

            const mode = this.ins.mode.getValidatedValue();

            if (mode === EAnnotationsTaskMode.Create) {
                this.createAnnotation(position, normal);
                event.stopPropagation = true;
            }
            else if (mode === EAnnotationsTaskMode.Move) {
                this.moveAnnotation(position, normal);
                event.stopPropagation = true;
            }
        }
    }

    protected createAnnotation(position: number[], direction: number[])
    {
        const annotations = this.activeAnnotations;
        if (!annotations) {
            return;
        }

        const activeAnnotation = annotations.activeAnnotation;
        let template = undefined;

        if (activeAnnotation) {
            template = activeAnnotation.toJSON();
            template.id = Annotation.generateId();
        }

        const model = annotations.getComponent(CVModel2);
        const annotation = new Annotation(template);

        const data = annotation.data;
        data.position = position;
        data.direction = direction;

        if (!template) {
            data.scale = this._defaultScale * (1 / model.outs.unitScale.value);
        }

        annotations.addAnnotation(annotation);
        annotations.activeAnnotation = annotation;
    }

    protected moveAnnotation(position: number[], direction: number[])
    {
        const annotations = this.activeAnnotations;
        if (annotations) {
            const annotation = annotations.activeAnnotation;

            if (annotation) {
                annotation.data.position = position;
                annotation.data.direction = direction;
                annotation.update();

                annotations.updateAnnotation(annotation);
                this.emitUpdateEvent();
            }
        }
    }

    protected onActiveDocument(previous: CVDocument, next: CVDocument)
    {
        super.onActiveDocument(previous, next);

        if (next) {
            const scene = next.getInnerComponent(CVScene);
            this._defaultScale = scene.outs.boundingRadius.value * 0.05;
        }
    }

    protected onActiveNode(previous: NVNode, next: NVNode)
    {
        const prevAnnotations = previous ? previous.getComponent(CVAnnotationView, true) : null;
        const nextAnnotations = next ? next.getComponent(CVAnnotationView, true) : null;

        if (prevAnnotations) {
            prevAnnotations.off<IAnnotationsUpdateEvent>("annotation-update", this.emitUpdateEvent, this);
        }
        if (nextAnnotations) {
            nextAnnotations.on<IAnnotationsUpdateEvent>("annotation-update", this.emitUpdateEvent, this);
        }

        const prevModel = previous ? previous.getComponent(CVModel2, true) : null;
        const nextModel = next ? next.getComponent(CVModel2, true) : null;

        if (prevModel) {
            prevModel.off<IPointerEvent>("pointer-up", this.onPointerUp, this);
        }
        if (nextModel) {
            nextModel.on<IPointerEvent>("pointer-up", this.onPointerUp, this);
        }

        this.activeAnnotations = nextAnnotations;
    }

    protected emitUpdateEvent()
    {
        this.emit("update");
    }
}