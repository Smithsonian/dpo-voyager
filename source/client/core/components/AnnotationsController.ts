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

import { IPublisherEvent } from "@ff/core/ecs/Component";
import types from "@ff/core/ecs/propertyTypes";

import PresentationController, { IPresentationChangeEvent } from "./PresentationController";
import Annotations, { IAnnotation, Vector3 } from "./Annotations";
import Controller, { Actions, Commander } from "./Controller";
import AnnotationsView from "./AnnotationsView";

////////////////////////////////////////////////////////////////////////////////

export interface ISelectAnnotationEvent extends IPublisherEvent<AnnotationsController>
{
    annotations: Annotations;
    annotation: IAnnotation;
}

export type AnnotationsActions = Actions<AnnotationsController>;

export default class AnnotationsController extends Controller<AnnotationsController>
{
    static readonly type: string = "AnnotationsController";

    ins = this.makeProps({
        enabled: types.Boolean("Enabled", true)
    });

    actions: AnnotationsActions;

    protected presentationController: PresentationController = null;

    protected activeAnnotations: Annotations = null;
    protected selectedAnnotation: IAnnotation = null;

    constructor(id?: string)
    {
        super(id);
        this.addEvents("select");
    }

    create()
    {
        super.create();
        this.presentationController = this.getComponent(PresentationController);
        this.presentationController.on("presentation", this.onPresentationChange, this);
    }

    dispose()
    {
        this.presentationController.off("presentation", this.onPresentationChange, this);

        super.dispose();
    }

    update()
    {
        const enabled = this.ins.enabled;
        if (enabled.changed) {
            this.presentationController.forEachComponent(AnnotationsView, component => {
                component.setVisible(enabled.value);
            });
        }
    }

    createActions(commander: Commander)
    {
        const actions = {
            selectAnnotation: commander.register({
                name: "Select Annotation", do: this.selectAnnotation, target: this
            })
        };

        this.actions = actions;
        return actions;
    }

    getSelectedAnnotation()
    {
        return this.selectedAnnotation;
    }

    selectAnnotation(annotations: Annotations, annotation: IAnnotation)
    {
        if (annotation !== this.selectedAnnotation) {
            this.activeAnnotations = annotations;
            this.selectedAnnotation = annotation;
            this.emit<ISelectAnnotationEvent>("select", { annotations, annotation });
        }
    }

    protected onPresentationChange(event: IPresentationChangeEvent)
    {

    }
}