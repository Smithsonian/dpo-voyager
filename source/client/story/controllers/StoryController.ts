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

import resolvePathname from "resolve-pathname";

import fetch from "@ff/browser/fetch";

import Controller, { Actions, ITypedEvent } from "@ff/core/Controller";
import Commander from "@ff/core/Commander";

import ExplorerSystem from "../../explorer/ExplorerSystem";
import Presentation from "../../explorer/nodes/Presentation";
import Item from "../../explorer/nodes/Item";

import Task from "../tasks/Task";
import taskSets from "../tasks/taskSets";

////////////////////////////////////////////////////////////////////////////////

export type TaskSetName = "prep" | "author";
export type StoryActions = Actions<StoryController>;

export interface ITaskChangeEvent extends ITypedEvent<"change">
{
    previous: Task;
    next: Task;
}

export default class StoryController extends Controller<StoryController>
{
    readonly system: ExplorerSystem;

    private _tasks: Task[] = [];
    private _activeTaskIndex: number = 0;
    private _currentSet: TaskSetName = null;
    private _expertMode = false;
    private _referrer: string = "";

    constructor(system: ExplorerSystem, commander: Commander)
    {
        super(commander);
        this.addEvents("change");

        this.system = system;
        this.taskSet = "prep";
    }

    createActions(commander: Commander)
    {
        return {

        };
    }

    set referrer(url: string)
    {
        this._referrer = url;
    }

    exitApplication()
    {
        if (this._referrer) {
            location.assign(this._referrer);
        }
    }

    get tasks(): Readonly<Task[]> {
        return this._tasks;
    }

    get taskSet(): string {
        return this._currentSet;
    }

    set taskSet(set: string) {
        if (set !== this._currentSet) {
            const taskTypes = taskSets[set] as Array<typeof Task>;
            if (taskTypes) {
                const previousTask = this.activeTask;
                this._currentSet = set as TaskSetName;
                this._tasks = taskTypes.map(type => new type(this.system));
                this._activeTaskIndex = 0;

                if (previousTask) {
                    previousTask.deactivate();
                }

                this.emit<ITaskChangeEvent>({
                    type: "change", previous: previousTask, next: this.activeTask
                });

                if (this.activeTask) {
                    this.activeTask.activate();
                }
            }
        }
    }

    get expertMode() {
        return this._expertMode;
    }

    set expertMode(state: boolean) {
        this._expertMode = !!state;

        this.emit<ITaskChangeEvent>({
            type: "change", previous: this.activeTask, next: this.activeTask
        });
    }

    get activeTaskIndex() {
        return this._activeTaskIndex;
    }

    set activeTaskIndex(index: number) {
        if (index !== this._activeTaskIndex) {
            const previousTask = this.activeTask;
            this._activeTaskIndex = index;

            if (previousTask) {
                previousTask.deactivate();
            }

            this.emit<ITaskChangeEvent>({
                type: "change", previous: previousTask, next: this.activeTask
            });

            if (this.activeTask) {
                this.activeTask.activate();
            }
        }
    }

    get activeTask() {
        return this._tasks[this._activeTaskIndex];
    }

    toggleExpertMode()
    {
        this.expertMode = !this.expertMode;
    }

    save()
    {
        const system = this.system;

        if (this.taskSet === "prep") {
            const item = system.nodes.get(Item);
            if (item) {
                const data = item.toItemData();
                const url = item.url;

                console.log("StoryController.save - Item URL: %s", url);
                console.log(data);
                fetch.json(url, "PUT", data).then(response => {
                    console.log(response);
                }).catch(error => {
                    console.error(error);
                });
            }
        }
        else {
            const presentation = system.nodes.get(Presentation);
            if (presentation) {
                console.log("StoryController.save - Presentation");
                console.log(presentation.toData());
            }
        }

    }
}