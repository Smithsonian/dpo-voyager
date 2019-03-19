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

import Component, { types } from "@ff/graph/Component";

import CTransform from "@ff/scene/components/CTransform";
import CModel from "@ff/scene/components/CModel";

import { IModel } from "common/types/model";

////////////////////////////////////////////////////////////////////////////////

/**
 * Graph component rendering a model or model part.
 */
export default class CVModel extends CModel
{
    static readonly typeName: string = "CVModel";

    protected static readonly ins = {
    };

    protected static readonly outs = {
    };

    ins = this.addInputs(CVModel.ins);
    outs = this.addOutputs(CVModel.outs);

    create()
    {
        super.create();
    }

    fromData(data: IModel)
    {

    }

    toData(): IModel
    {
        return null;
    }
}