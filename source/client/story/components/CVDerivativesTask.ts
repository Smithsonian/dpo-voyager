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

import { types } from "@ff/graph/propertyTypes";

import NVItem from "../../explorer/nodes/NVItem";
import CVModel from "../../core/components/CVModel";

import DerivativesTaskView from "../ui/DerivativesTaskView";
import CVTask from "./CVTask";
import { IComponentEvent } from "@ff/graph/Component";
import { IActiveItemEvent, IActivePresentationEvent } from "../../explorer/components/CVPresentationController";
import CVInterface from "../../explorer/components/CVInterface";

////////////////////////////////////////////////////////////////////////////////

export enum EDerivativesTaskMode { Off }

const _inputs = {
    mode: types.Enum("Mode", EDerivativesTaskMode, EDerivativesTaskMode.Off),
};

export default class CVDerivativesTask extends CVTask
{
    static readonly typeName: string = "CVDerivativesTask";

    static readonly text: string = "Derivatives";
    static readonly icon: string = "hierarchy";

    ins = this.addInputs<CVTask, typeof _inputs>(_inputs);

    private _activeModel: CVModel = null;
    private _interfaceVisible = false;
    private _gridVisible = false;
    private _annotationsVisible = false;

    get activeModel() {
        return this._activeModel;
    }
    set activeModel(model: CVModel) {
        if (model !== this._activeModel) {
            this._activeModel = model;
            this.emitUpdateEvent();
        }
    }

    protected get interface() {
        return this.getMainComponent(CVInterface);
    }

    createView()
    {
        return new DerivativesTaskView(this);
    }

    activate()
    {
        super.activate();

        this.selectionController.selectedComponents.on(CVModel, this.onSelectModel, this);

        // disable interface overlay
        const interface_ = this.interface;
        if (interface_) {
            this._interfaceVisible = interface_.ins.visible.value;
            interface_.ins.visible.setValue(false);
        }
    }

    deactivate()
    {
        this.selectionController.selectedComponents.off(CVModel, this.onSelectModel, this);

        // restore interface visibility
        const interface_ = this.interface;
        if (interface_) {
            interface_.ins.visible.setValue(this._interfaceVisible);
        }

        super.deactivate();
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
            prop.setValue(false);
        }

        super.onActivePresentation(event);
    }

    protected onActiveItem(event: IActiveItemEvent)
    {
        const prevModel = event.previous ? event.previous.model : null;
        const nextModel = event.next ? event.next.model : null;

        if (nextModel) {
            this.selectionController.selectComponent(nextModel);
        }

        this.activeModel = nextModel;
    }

    protected onSelectModel(event: IComponentEvent<CVModel>)
    {
        if (event.add && event.object.node instanceof NVItem) {
            this.presentationController.activeItem = event.object.node;
        }
    }
}