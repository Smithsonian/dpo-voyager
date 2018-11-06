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

import { IComponentChangeEvent } from "@ff/core/ecs/Component";

import Model from "../../core/components/Model";
import Annotations, { IAnnotation, Vector3 } from "../../core/components/Annotations";

import PickManip, { IPickManipPickEvent } from "../../core/components/PickManip";
import AnnotationsController, { ISelectAnnotationEvent } from "../../core/components/AnnotationsController";

import Controller, { Actions, Commander } from "../../core/components/Controller";

////////////////////////////////////////////////////////////////////////////////

const _mat4 = new THREE.Matrix4();
const _mat3 = new THREE.Matrix3();
const _pos = new THREE.Vector3();
const _dir = new THREE.Vector3();

export { IAnnotation };

export enum AnnotationsEditMode { Off, Select, Create, Move }

export interface IAnnotationsChangeEvent extends IComponentChangeEvent<AnnotationsEditController>
{
    what: "selection" | "set" | "item";
    annotations: Annotations;
    annotation: IAnnotation;
}

export type AnnotationsEditActions = Actions<AnnotationsEditController>;

export default class AnnotationsEditController extends Controller<AnnotationsEditController>
{
    static readonly type: string = "AnnotationsEditController";

    actions: AnnotationsEditActions = null;

    protected mode: AnnotationsEditMode = AnnotationsEditMode.Off;

    protected annotationsController: AnnotationsController = null;
    protected pickManip: PickManip = null;

    protected activeAnnotations: Annotations = null;
    protected selectedAnnotation: IAnnotation = null;

    constructor(id?: string)
    {
        super(id);
        this.addEvents("change");
    }

    create()
    {
        super.create();

        this.annotationsController = this.getComponent(AnnotationsController);
        this.annotationsController.on("select", this.onSelectAnnotation, this);

        this.pickManip = this.getComponent(PickManip, true);
        this.pickManip.on("down", this.onPick, this);
    }

    dispose()
    {
        this.annotationsController.off("select", this.onSelectAnnotation, this);
        this.pickManip.off("down", this.onPick, this);
    }

    createActions(commander: Commander)
    {
        const actions = {
            createAnnotation: commander.register({
                name: "Create Annotation", do: this.createAnnotation, target: this
            }),
            moveAnnotation: commander.register({
                name: "Move Annotation", do: this.moveAnnotation, target: this
            })
        };

        this.actions = actions;
        return actions;
    }

    setMode(mode: AnnotationsEditMode)
    {
        this.mode = mode;
        console.log("AnnotationsEditController.setMode - ", AnnotationsEditMode[mode]);
    }

    getActiveAnnotations()
    {
        return this.activeAnnotations;
    }

    getSelectedAnnotation()
    {
        return this.selectedAnnotation;
    }

    protected createAnnotation(position: Vector3, direction: Vector3)
    {
        const annotation = this.activeAnnotations.createAnnotation(position, direction);
        this.annotationsController.actions.select(this.activeAnnotations, annotation);
    }

    protected removeAnnotation()
    {
        if (this.selectedAnnotation) {
            this.activeAnnotations.removeAnnotation(this.selectedAnnotation.id);
        }
    }

    protected moveAnnotation(position: Vector3, direction: Vector3)
    {
        const annotation = this.selectedAnnotation;

        if (annotation) {
            this.activeAnnotations.moveAnnotation(annotation.id, position, direction);

            this.emit<IAnnotationsChangeEvent>("change", {
                what: "item", annotations: this.activeAnnotations, annotation
            });
        }
    }

    protected setContent(title: string, description: string)
    {
        const annotation = this.selectedAnnotation;

        if (annotation) {
            annotation.title = title;
            annotation.description = description;

            this.emit<IAnnotationsChangeEvent>("change", {
                what: "set", annotations: this.activeAnnotations, annotation
            });
        }
    }

    protected onPick(event: IPickManipPickEvent)
    {
        // update current item/model/annotations selection
        const annotations = event.component ? event.component.getComponent(Annotations) : null;

        if (annotations !== this.activeAnnotations) {
            // target model/annotation set has changed, update
            this.activeAnnotations = annotations;
            this.selectedAnnotation = null;

            // emit change event
            this.emit<IAnnotationsChangeEvent>("change", {
                what: "set", annotations: this.activeAnnotations, annotation: null
            });

            // if in move mode and target model/annotation set has changed, abort
            if (this.mode === AnnotationsEditMode.Move) {
                return;
            }
        }

        // early abort if no active model/annotation set or edit mode is off
        if (!this.activeAnnotations || this.mode === AnnotationsEditMode.Off) {
            return;
        }

        // get the active model based on the active annotation set
        const model = this.activeAnnotations.getComponent(Model);

        if (event.component === model) {
            // the model has been picked; transform position, direction from world to local space
            const matWorld = model.object3D.matrixWorld;
            _mat4.getInverse(matWorld);
            _pos.copy(event.point);
            _pos.applyMatrix4(_mat4);

            _mat3.setFromMatrix4(matWorld).transpose();
            _dir.copy(event.normal);
            _dir.applyMatrix3(_mat3).normalize();

            // perform action depending on current edit mode
            switch(this.mode) {
                case AnnotationsEditMode.Create:
                    this.actions.createAnnotation(_pos.toArray(), _dir.toArray());
                    break;

                case AnnotationsEditMode.Move:
                    this.actions.moveAnnotation(_pos.toArray(), _dir.toArray());
                    break;
            }
        }
    }

    protected onSelectAnnotation(event: ISelectAnnotationEvent)
    {
        switch(this.mode) {
            case AnnotationsEditMode.Select:
                this.activeAnnotations = event.annotations;
                this.selectedAnnotation = event.annotation;
                break;

            case AnnotationsEditMode.Move:
                if (event.annotation) {
                    this.activeAnnotations = event.annotations;
                    this.selectedAnnotation = event.annotation;
                }
                break;
        }

        this.emit<IAnnotationsChangeEvent>("change", {
            what: "selection", annotations: event.annotations, annotation: event.annotation
        });
    }
}