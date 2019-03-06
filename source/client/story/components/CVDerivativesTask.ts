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

import { IComponentEvent, types } from "@ff/graph/Component";
import { IActiveDocumentEvent } from "@ff/graph/components/CDocumentManager";

import NVItem from "../../explorer/nodes/NVItem";
import CVModel from "../../core/components/CVModel";
import { IActiveItemEvent } from "../../explorer/components/CVItemManager";
import CVInterface from "../../explorer/components/CVInterface";
import CVDocument from "../../explorer/components/CVDocument";

import CVTask from "./CVTask";
import DerivativesTaskView from "../ui/DerivativesTaskView";

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

    activateTask()
    {
        super.activateTask();

        this.selectionController.selectedComponents.on(CVModel, this.onSelectModel, this);

        // disable interface overlay
        const interface_ = this.interface;
        if (interface_) {
            this._interfaceVisible = interface_.ins.visible.value;
            interface_.ins.visible.setValue(false);
        }
    }

    deactivateTask()
    {
        this.selectionController.selectedComponents.off(CVModel, this.onSelectModel, this);

        // restore interface visibility
        const interface_ = this.interface;
        if (interface_) {
            interface_.ins.visible.setValue(this._interfaceVisible);
        }

        super.deactivateTask();
    }

    protected onActiveDocument(event: IActiveDocumentEvent)
    {
        const prevPresentation = event.previous as CVDocument;
        const nextPresentation = event.next as CVDocument;

        if (prevPresentation) {
            prevPresentation.features.grid.ins.visible.setValue(this._gridVisible);
            prevPresentation.scene.ins.annotationsVisible.setValue(this._annotationsVisible);
        }
        if (nextPresentation) {
            let prop = nextPresentation.features.grid.ins.visible;
            this._gridVisible = prop.value;
            prop.setValue(false);

            prop = nextPresentation.scene.ins.annotationsVisible;
            this._annotationsVisible = prop.value;
            prop.setValue(false);
        }

        super.onActiveDocument(event);
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
        const node = event.object.node;

        if (event.add && node instanceof NVItem) {
            this.itemManager.activeItem = node;
        }
    }
}