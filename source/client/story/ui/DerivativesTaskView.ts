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

import { customElement, html } from "@ff/ui/CustomElement";

import "@ff/ui/Splitter";
import "@ff/ui/Button";

import NVItem from "../../explorer/nodes/NVItem";
import CVDerivativesTask from "../components/CVDerivativesTask";
import CVModel from "../../core/components/CVModel";
import Derivative from "../../core/models/Derivative";

import "./DerivativeList";
import { ISelectDerivativeEvent } from "./DerivativeList";

import TaskView from "./TaskView";

////////////////////////////////////////////////////////////////////////////////

@customElement("sv-derivatives-task-view")
export default class DerivativesTaskView extends TaskView
{
    protected task: CVDerivativesTask;
    protected activeModel: CVModel;
    protected selectedDerivative: Derivative = null;

    protected setActiveItem(item: NVItem)
    {
        this.activeModel = item ? item.model : null;
        this.selectedDerivative = null;

        this.performUpdate();
    }

    protected firstConnected()
    {
        super.firstConnected();
        this.classList.add("sv-derivatives-task-view");
    }

    protected connected()
    {
        super.connected();
        this.task.ins.mode.on("value", this.performUpdate, this);
    }

    protected disconnected()
    {
        this.task.ins.mode.off("value", this.performUpdate, this);
        super.disconnected();
    }

    protected render()
    {
        if (!this.activeModel) {
            return html`<div class="sv-placeholder">Please select an item to inspect its derivatives</div>`;
        }

        const derivatives = this.activeModel.derivatives.getArray();
        const derivative = this.selectedDerivative;

        const detailView = derivative ? html`` : null;

        return html`<div class="ff-flex-row ff-flex-wrap">
        </div>
        <sv-derivative-list .data=${derivatives} .selectedItem=${derivative} @select=${this.onSelectDerivative}></sv-derivative-list>
        ${detailView}`
    }

    protected onSelectDerivative(event: ISelectDerivativeEvent)
    {
        this.selectedDerivative = event.detail.derivative;
        this.performUpdate();
    }
}