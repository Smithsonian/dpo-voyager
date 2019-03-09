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

import NVItem from "../../explorer/nodes/NVItem";
import CVModel from "../../core/components/CVModel";

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

    createView()
    {
        return new DerivativesTaskView(this);
    }

    activateTask()
    {
        super.activateTask();

        this.selectionController.selectedComponents.on(CVModel, this.onSelectModel, this);
    }

    deactivateTask()
    {
        this.selectionController.selectedComponents.off(CVModel, this.onSelectModel, this);

        super.deactivateTask();
    }

    create()
    {
        super.create();

        const configuration = this.configuration;
        configuration.interfaceVisible = false;
        configuration.bracketsVisible = false;
        configuration.gridVisible = false;
        configuration.annotationsVisible = false;
    }

    protected onActiveItem(previous: NVItem, next: NVItem)
    {
        if (next) {
            this.selectionController.selectComponent(next.model);
        }
    }

    protected onSelectModel(event: IComponentEvent<CVModel>)
    {
        const node = event.object.node;

        if (event.add && node instanceof NVItem) {
            this.itemManager.activeItem = node;
        }
    }
}