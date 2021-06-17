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

import { Vector3, Quaternion, Matrix4, Matrix3, Object3D } from "three";

import * as helpers from "@ff/three/helpers";

import { Node, types } from "@ff/graph/Component";

import { IPointerEvent } from "@ff/scene/RenderView";

import Annotation from "../models/Annotation";

import NVNode from "../nodes/NVNode";

import CVDocument from "./CVDocument";
import CVTask from "./CVTask";
import CVModel2 from "./CVModel2";
import CVAnnotationView, { IAnnotationsUpdateEvent, IAnnotationClickEvent } from "./CVAnnotationView";

import AnnotationsTaskView from "../ui/story/AnnotationsTaskView";
import CVScene from "client/components/CVScene";
import { ELanguageStringType, ELanguageType, DEFAULT_LANGUAGE } from "client/schema/common";

////////////////////////////////////////////////////////////////////////////////

const _position = new Vector3();
const _scaling = new Vector3();
const _quat = new Quaternion();
const _mat4 = new Matrix4();
const _mat3 = new Matrix3();

export enum EAnnotationsTaskMode { Off, Move, Create }

export default class CVAnnotationsTask extends CVTask
{
    static readonly typeName: string = "CVAnnotationsTask";

    static readonly text: string = "Annotations";
    static readonly icon: string = "comment";

    protected static readonly ins = {
        mode: types.Enum("Mode", EAnnotationsTaskMode, EAnnotationsTaskMode.Off),
        language: types.Option("Task.Language", Object.keys(ELanguageStringType).map(key => ELanguageStringType[key]), ELanguageStringType[ELanguageType.EN]),
    };

    protected static readonly outs = {
        language: types.Enum("Interface.Language", ELanguageType, ELanguageType.EN),
    };

    ins = this.addInputs<CVTask, typeof CVAnnotationsTask.ins>(CVAnnotationsTask.ins);
    outs = this.addOutputs<CVTask, typeof CVAnnotationsTask.outs>(CVAnnotationsTask.outs);

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
        this.synchLanguage();

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
        const {ins, outs} = this;
        
        if(!this.activeDocument) {
            return false;
        }
        const languageManager = this.activeDocument.setup.language;

        if (ins.mode.changed) {
            this.emitUpdateEvent();
        }

        if(ins.language.changed) {   
            const newLanguage = ELanguageType[ELanguageType[ins.language.value]];

            languageManager.addLanguage(newLanguage);  // add in case this is a currently inactive language
            languageManager.ins.language.setValue(newLanguage);
            outs.language.setValue(newLanguage);
            return true;
        }

        this.synchLanguage();

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

            // add mesh parent transforms in this branch
            _mat4.copy(_mat4.multiply(this.getMeshTransform(model.object3D, event.object3D).invert()));   
            _mat3.getNormalMatrix(_mat4);

            const position = event.view.pickPosition(event).applyMatrix4(_mat4).toArray();
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

        this.activeDocument.setup.language.ins.language.setValue(ELanguageType[DEFAULT_LANGUAGE]);
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

        if(previous) {
            previous.setup.language.outs.language.off("value", this.update, this);
        }
        if (next) {
            const scene = next.getInnerComponent(CVScene);
            this._defaultScale = scene.outs.boundingRadius.value * 0.05;

            next.setup.language.outs.language.on("value", this.update, this);
        }
    }

    protected onActiveNode(previous: NVNode, next: NVNode)
    {
        const prevAnnotations = previous ? previous.getComponent(CVAnnotationView, true) : null;
        const nextAnnotations = next ? next.getComponent(CVAnnotationView, true) : null;

        if (prevAnnotations) {
            prevAnnotations.off<IAnnotationsUpdateEvent>("annotation-update", this.emitUpdateEvent, this);
            prevAnnotations.off<IAnnotationClickEvent>("click", this.onAnnotationClick, this);
        }
        if (nextAnnotations) {
            nextAnnotations.on<IAnnotationClickEvent>("click", this.onAnnotationClick, this);
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

    // Handles annotation selection in outside of task.
    protected onAnnotationClick(event: IAnnotationClickEvent) 
    {
        // HACK to blur potentially selected textboxes when an annotation
        // is clicked outside of the task UI and is consumed before getting here.
        const textboxes = document.getElementsByClassName("ff-text-edit");
        for(let box of textboxes) {
            (box as HTMLElement).blur();
        }
    }

    /** Accumulates transforms from current object to root. */
    protected getMeshTransform(root : Object3D, current: Object3D)
    {
        var result = new Matrix4();
        var tempMatrix = new Matrix4();

        result.identity();

        do {
            tempMatrix.compose(current.position, current.quaternion, current.scale);
            result.multiply(tempMatrix.invert());

            current = current.parent;
        }
        while (root !== current)

        return result;
    }

    // Make sure this task language matches document
    protected synchLanguage() {
        const {ins} = this;
        const languageManager = this.activeDocument.setup.language;

        if(ins.language.value !== languageManager.outs.language.value)
        {
            ins.language.setValue(languageManager.outs.language.value, true);
        }
    }
}