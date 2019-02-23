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
import CDocumentManager, { IActiveDocumentEvent } from "@ff/graph/components/CDocumentManager";

import CPickSelection from "@ff/scene/components/CPickSelection";

import CVItemManager, { IActiveItemEvent } from "../../explorer/components/CVItemManager";

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
    static readonly typeName: string = "CVTask";

    static readonly text: string = "Task";
    static readonly icon: string = "fa fa-tasks";

    ins = this.addInputs(_inputs);

    get taskController() {
        return this.getMainComponent(CVTaskController);
    }
    get selectionController() {
        return this.getMainComponent(CPickSelection);
    }
    get documentManager() {
        return this.getMainComponent(CDocumentManager);
    }
    get itemManager() {
        return this.getMainComponent(CVItemManager);
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

    activateTask()
    {
        const documentManager = this.documentManager;
        documentManager.on<IActiveDocumentEvent>("active-document", this.onActiveDocument, this);
        this.onActiveDocument({ type: "active-document", previous: null, next: documentManager.activeDocument });

        const itemManager = this.itemManager;
        itemManager.on<IActiveItemEvent>("active-item", this.onActiveItem, this);
        this.onActiveItem({ type: "active-item", previous: null, next: itemManager.activeItem });
    }

    deactivateTask()
    {
        const itemManager = this.itemManager;
        itemManager.off<IActiveItemEvent>("active-item", this.onActiveItem, this);
        this.onActiveItem({ type: "active-item", previous: itemManager.activeItem, next: null });

        const documentManager = this.documentManager;
        documentManager.off<IActiveDocumentEvent>("active-document", this.onActiveDocument, this);
        this.onActiveDocument({ type: "active-document", previous: documentManager.activeDocument, next: null });
    }

    /**
     * Called when the currently active document changes.
     * @param event
     */
    protected onActiveDocument(event: IActiveDocumentEvent)
    {
    }

    /**
     * Called when the currently active item changes.
     * @param event
     */
    protected onActiveItem(event: IActiveItemEvent)
    {
    }

    protected emitUpdateEvent()
    {
        this.emit<ITaskUpdateEvent>({ type: "update" });
    }
}