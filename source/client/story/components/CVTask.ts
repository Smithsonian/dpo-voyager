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

import CVPresentationController, {
    IActiveItemEvent,
    IActivePresentationEvent
} from "../../explorer/components/CVPresentationController";

import NVItem from "../../explorer/nodes/NVItem";
import CVPresentation from "../../explorer/components/CVPresentation";

import CVTaskController from "./CVTaskController";
import TaskView from "../ui/TaskView";

////////////////////////////////////////////////////////////////////////////////

const ins = {
    activate: types.Event("Activate")
};

export default class CVTask extends Component
{
    static readonly type: string = "CVTask";

    static readonly text: string = "Task";
    static readonly icon: string = "fa fa-tasks";

    ins = this.addInputs(ins);

    protected tasks: CVTaskController = null;
    protected presentations: CVPresentationController = null;
    protected selection: CPickSelection = null;

    protected activePresentation: CVPresentation = null;
    protected activeItem: NVItem = null;

    create()
    {
        this.tasks = this.system.getMainComponent(CVTaskController, true);
        this.presentations = this.system.getMainComponent(CVPresentationController, true);
        this.selection = this.system.getMainComponent(CPickSelection, true);
    }

    update()
    {
        if (this.ins.activate.changed) {
            this.tasks.activeTask = this;
        }

        return false;
    }

    createView(): TaskView
    {
        throw new Error("must override");
    }

    activate()
    {
        this.presentations.on<IActivePresentationEvent>("active-presentation", this.onActivePresentation, this);
        this.presentations.on<IActiveItemEvent>("active-item", this.onActiveItem, this);

        this.setActivePresentation(this.presentations.activePresentation);
        this.activePresentation = this.presentations.activePresentation;

        this.setActiveItem(this.presentations.activeItem);
        this.activeItem = this.presentations.activeItem;
    }

    deactivate()
    {
        this.setActivePresentation(null);
        this.activePresentation = null;

        this.setActiveItem(null);
        this.activeItem = null;

        this.presentations.off<IActivePresentationEvent>("active-presentation", this.onActivePresentation, this);
        this.presentations.off<IActiveItemEvent>("active-item", this.onActiveItem, this);
    }

    protected setActivePresentation(presentation: CVPresentation)
    {
    }

    protected setActiveItem(item: NVItem)
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