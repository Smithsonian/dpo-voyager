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
import Component from "@ff/graph/Component";

import CPickSelection from "@ff/scene/components/CPickSelection";

import CPresentationManager, {
    IActiveItemEvent,
    IActivePresentationEvent
} from "../../explorer/components/CPresentationManager";

import NTasks from "../nodes/NTasks";
import NItem from "../../explorer/nodes/NItem";
import CPresentation from "../../explorer/components/CPresentation";

import TaskView from "../ui/TaskView";

////////////////////////////////////////////////////////////////////////////////

const ins = {
    activate: types.Event("Activate")
};

export default class CTask extends Component
{
    static readonly type: string = "CTask";

    static readonly text: string = "Task";
    static readonly icon: string = "fa fa-tasks";

    ins = this.addInputs(ins);

    protected manager: CPresentationManager = null;
    protected selection: CPickSelection = null;

    protected activePresentation: CPresentation = null;
    protected activeItem: NItem = null;

    create()
    {
        this.selection = this.system.components.safeGet(CPickSelection);
        this.manager = this.system.components.safeGet(CPresentationManager);
    }

    update()
    {
        if (this.ins.activate.changed) {
            const tasksNode = this.node as NTasks;
            tasksNode.activeTask = this;
        }

        return false;
    }

    createView(): TaskView
    {
        throw new Error("must override");
    }

    activate()
    {
        this.manager.on<IActivePresentationEvent>("active-presentation", this.onActivePresentation, this);
        this.manager.on<IActiveItemEvent>("active-item", this.onActiveItem, this);

        this.setActivePresentation(this.manager.activePresentation);
        this.activePresentation = this.manager.activePresentation;

        this.setActiveItem(this.manager.activeItem);
        this.activeItem = this.manager.activeItem;
    }

    deactivate()
    {
        this.setActivePresentation(null);
        this.activePresentation = null;

        this.setActiveItem(null);
        this.activeItem = null;

        this.manager.off<IActivePresentationEvent>("active-presentation", this.onActivePresentation, this);
        this.manager.off<IActiveItemEvent>("active-item", this.onActiveItem, this);
    }

    protected setActivePresentation(presentation: CPresentation)
    {
    }

    protected setActiveItem(item: NItem)
    {
    }

    protected onActivePresentation(event: IActivePresentationEvent)
    {
        this.setActivePresentation(event.next);
        this.activePresentation = event.next;
    }

    protected onActiveItem(event: IActiveItemEvent)
    {
        this.setActiveItem(event.next);
        this.activeItem = event.next;
    }
}