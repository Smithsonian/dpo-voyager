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

import CSelection from "@ff/graph/components/CSelection";

import CustomElement, { customElement, property } from "@ff/ui/CustomElement";

import CPresentationManager, {
    IActiveItemEvent,
    IActivePresentationEvent
} from "../../explorer/components/CPresentationManager";

import NItem from "../../explorer/nodes/NItem";
import CTask from "../components/CTask";

////////////////////////////////////////////////////////////////////////////////

export default class TaskView extends CustomElement
{
    protected task: CTask;
    protected manager: CPresentationManager = null;
    protected selection: CSelection = null;

    constructor(task: CTask)
    {
        super();
        this.task = task;
    }

    protected get system() {
        return this.task.system;
    }

    protected firstConnected()
    {
        this.classList.add("sv-task-view");

        this.manager = this.system.components.safeGet(CPresentationManager);
        this.selection = this.system.components.safeGet(CSelection);
    }

    protected connected()
    {
        this.manager.on<IActivePresentationEvent>("active-presentation", this.onActivePresentation, this);
        this.manager.on<IActiveItemEvent>("active-item", this.onActiveItem, this);

        this.setActiveItem(this.manager.activeItem);
    }

    protected disconnected()
    {
        this.manager.off<IActivePresentationEvent>("active-presentation", this.onActivePresentation, this);
        this.manager.off<IActiveItemEvent>("active-item", this.onActiveItem, this);
    }

    protected onActivePresentation(event: IActivePresentationEvent)
    {
    }

    protected onActiveItem(event: IActiveItemEvent)
    {
        this.setActiveItem(event.next);
    }

    protected setActiveItem(item: NItem)
    {
    }
}