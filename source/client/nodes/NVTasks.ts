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

import Node from "@ff/graph/Node";

import CVTaskProvider from "../components/CVTaskProvider";

////////////////////////////////////////////////////////////////////////////////

export default class NVTasks extends Node
{
    static readonly typeName: string = "NVTasks";

    get taskManager() {
        return this.getComponent(CVTaskProvider);
    }

    createComponents()
    {
        this.createComponent(CVTaskProvider);
    }
}