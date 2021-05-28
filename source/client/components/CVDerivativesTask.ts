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

import { Node } from "@ff/graph/Component";

import CVTask from "./CVTask";
import DerivativesTaskView from "../ui/story/DerivativesTaskView";

////////////////////////////////////////////////////////////////////////////////

//export enum EDerivativesTaskMode { Off }

export default class CVDerivativesTask extends CVTask
{
    static readonly typeName: string = "CVDerivativesTask";

    static readonly text: string = "Derivatives";
    static readonly icon: string = "hierarchy";

    protected static readonly ins = {
        //mode: types.Enum("Mode", EDerivativesTaskMode, EDerivativesTaskMode.Off),
    };

    ins = this.addInputs<CVTask, typeof CVDerivativesTask.ins>(CVDerivativesTask.ins);


    constructor(node: Node, id: string)
    {
        super(node, id);

        const configuration = this.configuration;
        configuration.interfaceVisible = false;
        configuration.bracketsVisible = false;
        configuration.gridVisible = false;
        configuration.annotationsVisible = false;
    }

    createView()
    {
        return new DerivativesTaskView(this);
    }
}