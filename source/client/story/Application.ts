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


import Commander from "@ff/core/Commander";
import RenderSystem from "@ff/scene/RenderSystem";

import ExplorerApplication from "../explorer/Application";

import LogController from "./controllers/LogController";
import TaskController from "./controllers/TaskController";

import MainView from "./ui/MainView";

////////////////////////////////////////////////////////////////////////////////

export interface IApplicationProps
{
}

export default class Application
{
    readonly explorer: ExplorerApplication;
    readonly system: RenderSystem;
    readonly commander: Commander;

    readonly taskController: TaskController;
    readonly logController: LogController;

    constructor(props?: IApplicationProps, createView?: boolean)
    {
        this.explorer = new ExplorerApplication(null, false);
        this.system = this.explorer.system;
        this.commander = this.explorer.commander;

        this.logController = new LogController(this.system, this.commander);
        this.taskController = new TaskController(this.system, this.commander);
        this.taskController.taskSet = "prep";

        if (createView !== false) {
            new MainView(this).appendTo(document.body);
        }
    }
}

window["VoyagerStory"] = Application;