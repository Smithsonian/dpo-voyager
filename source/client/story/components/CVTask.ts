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
import Component, { ITypedEvent } from "@ff/graph/Component";

import CPickSelection from "@ff/scene/components/CPickSelection";

import CVPresentationController, {
    IActiveItemEvent,
    IActivePresentationEvent
} from "../../explorer/components/CVPresentationController";

import CVTaskController from "./CVTaskController";
import TaskView from "../ui/TaskView";

////////////////////////////////////////////////////////////////////////////////

const _inputs = {
    activate: types.Event("Activate")
};

export interface ITaskUpdateEvent extends ITypedEvent<"update">
{
}

export default class CVTask extends Component
{
    static readonly text: string = "Task";
    static readonly icon: string = "fa fa-tasks";

    ins = this.addInputs(_inputs);

    get presentationController() {
        return this.getMainComponent(CVPresentationController);
    }
    get taskController() {
        return this.getMainComponent(CVTaskController);
    }
    get selectionController() {
        return this.getMainComponent(CPickSelection);
    }

    update()
    {
        if (this.ins.activate.changed) {
            this.taskController.activeTask = this;
        }

        return false;
    }

    createView(): TaskView
    {
        throw new Error("must override");
    }

    activate()
    {
        const controller = this.presentationController;

        controller.on<IActivePresentationEvent>("active-presentation", this.onActivePresentation, this);
        controller.on<IActiveItemEvent>("active-item", this.onActiveItem, this);

        this.onActivePresentation({ type: "active-presentation", previous: null, next: controller.activePresentation });
        this.onActiveItem({ type: "active-item", previous: null, next: controller.activeItem });
    }

    deactivate()
    {
        const controller = this.presentationController;

        this.onActivePresentation({ type: "active-presentation", previous: controller.activePresentation, next: null });
        this.onActiveItem({ type: "active-item", previous: controller.activeItem, next: null });

        controller.off<IActivePresentationEvent>("active-presentation", this.onActivePresentation, this);
        controller.off<IActiveItemEvent>("active-item", this.onActiveItem, this);
    }

    protected onActivePresentation(event: IActivePresentationEvent)
    {
    }

    protected onActiveItem(event: IActiveItemEvent)
    {
    }

    protected emitUpdateEvent()
    {
        this.emit<ITaskUpdateEvent>({ type: "update" });
    }
}