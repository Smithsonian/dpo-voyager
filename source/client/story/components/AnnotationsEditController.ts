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

import Explorer from "../../core/components/Explorer";
import Model from "../../core/components/Model";
import Annotations, { IAnnotation, Vector3 } from "../../core/components/Annotations";

import PickManip, { IPickManipPickEvent } from "../../core/components/PickManip";
import SystemController from "../../core/components/SystemController";
import AnnotationsController, { ISelectAnnotationEvent } from "../../core/components/AnnotationsController";
import PrepController, { EPrepMode, IPrepModeChangeEvent } from "./PrepController";

import Controller, { Actions, Commander } from "../../core/components/Controller";

////////////////////////////////////////////////////////////////////////////////

const _mat4 = new THREE.Matrix4();
const _mat3 = new THREE.Matrix3();
const _pos = new THREE.Vector3();
const _dir = new THREE.Vector3();

export { IAnnotation };

export enum EAnnotationsEditMode { Off, Select, Create, Move }

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
    static readonly isSystemSingleton: boolean = true;

    actions: AnnotationsEditActions = null;

    protected mode: EAnnotationsEditMode = EAnnotationsEditMode.Off;

    protected systemController: SystemController = null;
    protected prepController: PrepController = null;
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

        this.systemController = this.getComponent(SystemController);

        this.prepController = this.getComponent(PrepController);
        this.prepController.on("mode", this.onPrepMode, this);

        this.annotationsController = this.getComponent(AnnotationsController);
        this.annotationsController.on("select", this.onSelectAnnotation, this);

        this.pickManip = this.getComponent(PickManip, true);
        this.pickManip.on("pick", this.onPick, this);
    }

    dispose()
    {
        this.prepController.off("mode", this.onPrepMode, this);
        this.annotationsController.off("select", this.onSelectAnnotation, this);
        this.pickManip.off("pick", this.onPick, this);
    }

    createActions(commander: Commander)
    {
        const actions = {
            selectAnnotation: commander.register({
                name: "Select Annotation", do: this.selectAnnotation, target: this
            }),
            createAnnotation: commander.register({
                name: "Create Annotation", do: this.createAnnotation, target: this
            }),
            setPosition: commander.register({
                name: "Move Annotation", do: this.setPosition, target: this
            }),
            setTitle: commander.register({
                name: "Set Annotation Title", do: this.setTitle, target: this
            }),
            setDescription: commander.register({
                name: "Set Annotation Description", do: this.setDescription, target: this
            }),
        };

        this.actions = actions;
        return actions;
    }

    setMode(mode: EAnnotationsEditMode)
    {
        this.mode = mode;
        console.log("AnnotationsEditController.setMode - ", EAnnotationsEditMode[mode]);
    }

    getActiveAnnotations()
    {
        return this.activeAnnotations;
    }

    getSelectedAnnotation()
    {
        return this.selectedAnnotation;
    }

    protected selectAnnotation(annotations: Annotations, annotation: IAnnotation)
    {
        this.annotationsController.selectAnnotation(annotations, annotation);
    }

    protected createAnnotation(position: Vector3, direction: Vector3)
    {
        const annotation = this.activeAnnotations.createAnnotation(position, direction);
        this.annotationsController.selectAnnotation(this.activeAnnotations, annotation);
    }

    protected removeAnnotation()
    {
        if (this.selectedAnnotation) {
            this.activeAnnotations.removeAnnotation(this.selectedAnnotation.id);
        }
    }

    protected setPosition(position: Vector3, direction: Vector3)
    {
        const annotation = this.selectedAnnotation;

        if (annotation) {
            this.activeAnnotations.setPosition(annotation.id, position, direction);

            this.emit<IAnnotationsChangeEvent>("change", {
                what: "item", annotations: this.activeAnnotations, annotation
            });
        }
    }

    protected setTitle(title: string)
    {
        const annotation = this.selectedAnnotation;

        if (annotation) {
            this.activeAnnotations.setTitle(annotation.id, title);

            this.emit<IAnnotationsChangeEvent>("change", {
                what: "set", annotations: this.activeAnnotations, annotation
            });
        }
    }

    protected setDescription(description: string)
    {
        const annotation = this.selectedAnnotation;

        if (annotation) {
            this.activeAnnotations.setDescription(annotation.id, description);

            this.emit<IAnnotationsChangeEvent>("change", {
                what: "set", annotations: this.activeAnnotations, annotation
            });
        }
    }

    protected onPrepMode(event: IPrepModeChangeEvent)
    {
        if (event.mode === EPrepMode.Annotate) {
            this.systemController.actions.setInputValue(Explorer, "Annotations.Enabled", true);
            this.setMode(EAnnotationsEditMode.Select);

        }
        else {
            this.setMode(EAnnotationsEditMode.Off);
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
            if (this.mode === EAnnotationsEditMode.Move) {
                return;
            }
        }

        // early abort if no active model/annotation set or edit mode is off
        if (!this.activeAnnotations || this.mode === EAnnotationsEditMode.Off) {
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
                case EAnnotationsEditMode.Create:
                    this.actions.createAnnotation(_pos.toArray(), _dir.toArray());
                    break;

                case EAnnotationsEditMode.Move:
                    this.actions.setPosition(_pos.toArray(), _dir.toArray());
                    break;
            }
        }
    }

    protected onSelectAnnotation(event: ISelectAnnotationEvent)
    {
        switch(this.mode) {
            case EAnnotationsEditMode.Create:
            case EAnnotationsEditMode.Move:
                if (event.annotation) {
                    this.activeAnnotations = event.annotations;
                    this.selectedAnnotation = event.annotation;
                }
                break;

            case EAnnotationsEditMode.Select:
                this.activeAnnotations = event.annotations;
                this.selectedAnnotation = event.annotation;
                break;
        }

        this.emit<IAnnotationsChangeEvent>("change", {
            what: "selection", annotations: event.annotations, annotation: event.annotation
        });
    }
}