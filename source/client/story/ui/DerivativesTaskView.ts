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

import Derivative from "../../core/models/Derivative";

import CVDerivativesTask from "../components/CVDerivativesTask";
import { TaskView } from "../components/CVTask";

import "./DerivativeList";
import { ISelectDerivativeEvent } from "./DerivativeList";


////////////////////////////////////////////////////////////////////////////////

@customElement("sv-derivatives-task-view")
export default class DerivativesTaskView extends TaskView<CVDerivativesTask>
{
    protected selectedDerivative: Derivative = null;


    protected render()
    {
        const item = this.activeItem;

        if (!item) {
            return html`<div class="sv-placeholder">Please select an item to inspect its derivatives</div>`;
        }

        const derivatives = item.model.derivatives.getArray();
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