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

import CVPresentationController, {
    IActiveItemEvent,
    IActivePresentationEvent
} from "../../explorer/components/CVPresentationController";

import NVItem from "../../explorer/nodes/NVItem";
import CVTask from "../components/CVTask";

////////////////////////////////////////////////////////////////////////////////

export default class TaskView extends CustomElement
{
    protected task: CVTask;
    protected presentations: CVPresentationController = null;
    protected selection: CSelection = null;

    constructor(task: CVTask)
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

        this.presentations = this.system.getMainComponent(CVPresentationController, true);
        this.selection = this.system.getMainComponent(CSelection, true);
    }

    protected connected()
    {
        this.presentations.on<IActivePresentationEvent>("active-presentation", this.onActivePresentation, this);
        this.presentations.on<IActiveItemEvent>("active-item", this.onActiveItem, this);

        this.setActiveItem(this.presentations.activeItem);
    }

    protected disconnected()
    {
        this.presentations.off<IActivePresentationEvent>("active-presentation", this.onActivePresentation, this);
        this.presentations.off<IActiveItemEvent>("active-item", this.onActiveItem, this);
    }

    protected onActivePresentation(event: IActivePresentationEvent)
    {
    }

    protected onActiveItem(event: IActiveItemEvent)
    {
        this.setActiveItem(event.next);
    }

    protected setActiveItem(item: NVItem)
    {
    }
}