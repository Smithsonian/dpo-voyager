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

import { customElement, html } from "@ff/ui/CustomElement";

import "@ff/ui/Splitter";
import "@ff/ui/Button";

import { EDerivativeUsage } from "client/schema/model";

import CVDerivativesTask from "../../components/CVDerivativesTask";
import { TaskView } from "../../components/CVTask";

import "./DerivativeList";
import { ISelectDerivativeEvent } from "./DerivativeList";
import NVNode from "client/nodes/NVNode";

////////////////////////////////////////////////////////////////////////////////

@customElement("sv-derivatives-task-view")
export default class DerivativesTaskView extends TaskView<CVDerivativesTask>
{
    protected render()
    {
        const node = this.activeNode;
        const model = node && node.model;

        if (!model) {
            return html`<div class="sv-placeholder">Please select a model node to inspect its derivatives</div>`;
        }

        const derivatives = model.derivatives.getByUsage(EDerivativeUsage.Web3D);

        const requestedQuality = model.ins.quality.value;
        const activeDerivative = model.derivatives.get(EDerivativeUsage.Web3D, requestedQuality);

        const loadedQuality = model.outs.quality.value;
        const loadedDerivative = model.derivatives.get(EDerivativeUsage.Web3D, loadedQuality);

        const detailView = activeDerivative ? html`` : null;

        return html`<div class="ff-flex-row ff-flex-wrap">
        </div>
        <sv-derivative-list .data=${derivatives} .selectedItem=${activeDerivative} .loadedItem=${loadedDerivative} @select=${this.onSelectDerivative}></sv-derivative-list>
        ${detailView}`
    }

    protected onSelectDerivative(event: ISelectDerivativeEvent)
    {
        if(event.detail.derivative) {
            const model = this.activeNode.model;
            model.ins.quality.setValue(event.detail.derivative.data.quality);
        }
    }

    protected onActiveNode(previous: NVNode, next: NVNode)
    {
        // listen to changes on active model's quality property
        if (previous && previous.model) {
            previous.model.ins.quality.off("value", this.onUpdate, this);
            previous.model.outs.quality.off("value", this.onUpdate, this);
            previous.model.outs.updated.off("value", this.onUpdate, this);
        }
        if (next && next.model) {
            next.model.ins.quality.on("value", this.onUpdate, this);
            next.model.outs.quality.on("value", this.onUpdate, this);
            next.model.outs.updated.on("value", this.onUpdate, this);
        }

        super.onActiveNode(previous, next);
    }
}