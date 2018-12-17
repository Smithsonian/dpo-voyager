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

import Controller, { Actions } from "@ff/core/Controller";
import Commander from "@ff/core/Commander";
import RenderSystem from "@ff/scene/RenderSystem";

////////////////////////////////////////////////////////////////////////////////

type TaskActions = Actions<TaskController>;

export default class TaskController extends Controller<TaskController>
{
    readonly system: RenderSystem;

    constructor(system: RenderSystem, commander: Commander)
    {
        super(commander);
        this.system = system;
    }

    createActions(commander: Commander)
    {
        return {

        };
    }

    getTasks()
    {

    }
}