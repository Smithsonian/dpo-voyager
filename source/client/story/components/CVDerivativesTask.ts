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

////////////////////////////////////////////////////////////////////////////////

export enum EDerivativesTaskMode { Off }

const _inputs = {
    mode: types.Enum("Mode", EDerivativesTaskMode, EDerivativesTaskMode.Off),
};

export default class CVDerivativesTask extends CVTask
{
    static readonly text: string = "Derivatives";
    static readonly icon: string = "hierarchy";

    ins = this.addInputs<CVTask, typeof _inputs>(_inputs);

    protected activeModel: CVModel = null;

    createView()
    {
        return new DerivativesTaskView(this);
    }

    activate()
    {
        super.activate();
        this.selection.selectedComponents.on(CVModel, this.onSelectModel, this);
    }

    deactivate()
    {
        this.selection.selectedComponents.off(CVModel, this.onSelectModel, this);
        super.deactivate();
    }

    protected setActiveItem(item: NVItem)
    {
        if (item && item.hasComponent(CVModel)) {
            this.activeModel = item.getComponent(CVModel);
            this.selection.selectComponent(this.activeModel);
        }
        else {
            this.activeModel = null;
        }
    }

    protected onSelectModel(event: IComponentEvent<CVModel>)
    {
        if (event.add && event.object.node instanceof NVItem) {
            this.presentations.activeItem = event.object.node;
        }
    }
}