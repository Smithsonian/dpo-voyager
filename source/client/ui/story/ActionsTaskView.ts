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

import "@ff/ui/Splitter";
import "@ff/ui/Button";

import "./PropertyView";

import CVActionsTask from "../../components/CVActionsTask";
import { TaskView, customElement, html, property } from "../../components/CVTask";
import List from "client/../../libs/ff-ui/source/List";
import { EActionTrigger, EActionType, IAction, IAudioClip, TActionType } from "client/schema/meta";
//import Notification from "@ff/ui/Notification";
import CVAnnotationView from "client/components/CVAnnotationView";

////////////////////////////////////////////////////////////////////////////////

@customElement("sv-actions-task-view")
export default class ActionsTaskView extends TaskView<CVActionsTask>
{
    protected connected()
    {
        super.connected();
        this.task.on("update", this.onUpdate, this);
    }

    protected disconnected()
    {
        this.task.off("update", this.onUpdate, this);
        super.disconnected();
    }

    protected render()
    {
        if(!this.task.actionManager) {
            return;
        }
        
        const ins = this.task.ins;

        const node = this.activeNode;
        const actionList = node && node.hasComponent(CVAnnotationView) && this.task.actions;

        if (!actionList) {
            return html`<div class="sv-placeholder">Please select a model node to edit its actions.</div>`;
        }

        const actionElement = actionList.find((action) => action.id === ins.activeId.value);

        const audioActionView = ins.type.value === EActionType.PlayAudio ? html`
            <sv-property-view .property=${ins.audio}></sv-property-view>
        ` : null;
        const animActionView = ins.type.value === EActionType.PlayAnimation ? html`
            <sv-property-view .property=${ins.style}></sv-property-view>
            <sv-property-view .property=${ins.animation}></sv-property-view>
        ` : null;
        const annoView = ins.trigger.value === EActionTrigger.OnAnnotation ? html`
            <sv-property-view .property=${ins.annotation}></sv-property-view>
        ` : null;

        const detailView = actionElement ? html`<div class="ff-scroll-y ff-flex-column sv-detail-view">
            <sv-property-view .property=${ins.trigger}></sv-property-view>
            ${annoView}
            <sv-property-view .property=${ins.type}></sv-property-view>
            ${audioActionView}
            ${animActionView}
        </div>` : null;

        return html`<div class="sv-commands">
            <ff-button text="Create" icon="create" @click=${this.onClickCreate}></ff-button>       
            <ff-button text="Delete" icon="trash" ?disabled=${!actionElement} @click=${this.onClickDelete}></ff-button>  
        </div>
        <div class="ff-flex-item-stretch">
            <div class="ff-flex-column ff-fullsize">
                <div class="ff-flex-row ff-group"><div class="sv-panel-header sv-task-item">Type</div><div class="sv-panel-header sv-task-item sv-item-border-l">Trigger</div></div>
                <div class="ff-splitter-section" style="flex-basis: 30%">
                    <div class="ff-scroll-y ff-flex-column">
                        <sv-action-list .data=${actionList} .selectedItem=${actionElement} @select=${this.onSelectAction}></sv-action-list>
                    </div>
                </div>
                <ff-splitter direction="vertical"></ff-splitter>
                <div class="ff-splitter-section" style="flex-basis: 70%">
                    ${detailView}
                </div>
            </div>
        </div>`;
    }

    protected onClickCreate()
    {
        this.task.ins.create.set();
    }

    protected onClickDelete()
    {
        this.task.ins.delete.set();
    }

    protected onSelectAction(event: ISelectActionEvent)
    {
        this.task.ins.activeId.setValue(event.detail.action ? event.detail.action.id : "");
        this.onUpdate();
    }
}

////////////////////////////////////////////////////////////////////////////////

interface ISelectActionEvent extends CustomEvent
{
    target: ActionList;
    detail: {
        action: IAction;
        index: number;
    }
}

@customElement("sv-action-list")
export class ActionList extends List<IAction>
{
    @property({ attribute: false })
    selectedItem: IAction = null;

    protected firstConnected()
    {
        super.firstConnected();
        this.classList.add("sv-action-list");
    }

    protected renderItem(item: IAction)
    {
        return html`<div class="ff-flex-row ff-group"><div class="sv-task-item">${item.type}</div><div class="sv-task-item sv-item-border-l">${item.trigger}</div></div>`;
    }

    protected isItemSelected(item: IAction)
    {
        return item === this.selectedItem;
    }

    protected onClickItem(event: MouseEvent, item: IAction, index: number)
    {
        this.dispatchEvent(new CustomEvent("select", {
            detail: { action: item, index }
        }));
    }

    protected onClickEmpty(event: MouseEvent)
    {
        this.dispatchEvent(new CustomEvent("select", {
            detail: { action: null, index: -1 }
        }));
    }
}
