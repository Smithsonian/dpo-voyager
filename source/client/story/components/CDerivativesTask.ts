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
import { IComponentEvent } from "@ff/graph/Node";

import NItem from "../../explorer/nodes/NItem";
import CModel from "../../core/components/CModel";

import DerivativesTaskView from "../ui/DerivativesTaskView";
import CTask from "./CTask";

////////////////////////////////////////////////////////////////////////////////

export default class CDerivativesTask extends CTask
{
    static readonly type: string = "CDerivativesTask";

    static readonly text: string = "Derivatives";
    static readonly icon: string = "hierarchy";

    protected activeModel: CModel = null;

    createView()
    {
        return new DerivativesTaskView(this);
    }

    activate()
    {
        super.activate();
    }

    deactivate()
    {
        super.deactivate();
    }

    protected setActiveItem(item: NItem)
    {
        if (item && item.model) {
            this.activeModel = item.model;
            this.selection.selectComponent(this.activeModel);
        }
        else {
            this.activeModel = null;
        }
    }
}