/**
 * 3D Foundation Project
 * Copyright 2024 Smithsonian Institution
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
import SettingsTaskView from "../ui/story/SettingsTaskView";

////////////////////////////////////////////////////////////////////////////////

export default class CVSettingsTask extends CVTask
{
    static readonly typeName: string = "CVSettingsTask";

    static readonly text: string = "Settings";
    static readonly icon: string = "eye";

    constructor(node: Node, id: string)
    {
        super(node, id);

        const configuration = this.configuration;
        configuration.interfaceVisible = true;
        configuration.bracketsVisible = true;
    }

    createView()
    {
        return new SettingsTaskView(this);
    }
}