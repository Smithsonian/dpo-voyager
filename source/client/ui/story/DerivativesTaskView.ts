/**
 * 3D Foundation Project
 * Copyright 2025 Smithsonian Institution
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
import CVModel2 from "../../components/CVModel2";
import { TaskView } from "../../components/CVTask";
import Derivative, { IDerivativeStateEvent } from "../../models/Derivative";

import "./DerivativeList";
import "./DerivativeDetails";
import { ISelectDerivativeEvent } from "./DerivativeList";
import { TDerivativeState, IActivateDerivativeEvent } from "./DerivativeDetails";
import NVNode from "client/nodes/NVNode";

////////////////////////////////////////////////////////////////////////////////

@customElement("sv-derivatives-task-view")
export default class DerivativesTaskView extends TaskView<CVDerivativesTask>
{
    /** Derivative whose details are shown below the list. Falls back to the one on display. */
    protected selectedDerivative: Derivative | null = null;

    /** Derivatives whose state we follow: those of the active model */
    protected watched = new Set<Derivative>();

    protected getState(model: CVModel2, derivative: Derivative): TDerivativeState
    {
        // "loaded" for a derivative is about memory; what is on display is the model's call
        if (derivative === model.activeDerivative) return "loaded";
        const state = derivative.state;
        return state === "loaded" ? "idle" : state;
    }

    /** What the details show: the user's pick, or else what is on display */
    protected getSelected(model: CVModel2): Derivative | null
    {
        const picked = this.selectedDerivative;
        return picked && model.derivatives.getArray().includes(picked) ? picked : model.activeDerivative;
    }

    /** Follows the derivatives of the model, which may gain some (an upload) */
    protected watch(derivatives: Derivative[])
    {
        for (const derivative of derivatives) {
            if (!this.watched.has(derivative)) {
                this.watched.add(derivative);
                derivative.on<IDerivativeStateEvent>("state", this.onUpdate, this);
            }
        }
    }

    protected unwatchAll()
    {
        for (const derivative of this.watched) {
            derivative.off<IDerivativeStateEvent>("state", this.onUpdate, this);
        }
        this.watched.clear();
    }

    protected render()
    {
        if(!this.activeDocument) {
            return;
        }

        const node = this.activeNode;
        const model = node && node.model;
        const languageManager = this.activeDocument.setup.language;

        if (!model) {
            return html`<div class="sv-placeholder">${languageManager.getUILocalizedString("Please select a model node to inspect its derivatives")}</div>`;
        }

        const derivatives = model.derivatives.getArray();
        this.watch(derivatives);
        const loadedDerivative = model.activeDerivative;
        const selected = this.getSelected(model);

        const detailView = selected ? html`<div class="ff-scroll-y ff-flex-column sv-detail-view">
            <sv-derivative-details .derivative=${selected} .state=${this.getState(model, selected)} .error=${selected.error} .languageManager=${languageManager}
                @activate=${this.onActivateDerivative}></sv-derivative-details>
        </div>` : null;

        return html`<div class="ff-flex-item-stretch">
            <div class="ff-flex-column ff-fullsize">
                <div class="sv-label">${model.ins.name.value}</div>
                <div class="ff-splitter-section" style="flex-basis: 30%">
                    <div class="ff-scroll-y ff-flex-column">
                        <sv-derivative-list .data=${derivatives} .selectedItem=${selected} .loadedItem=${loadedDerivative} @select=${this.onSelectDerivative}></sv-derivative-list>
                    </div>
                </div>
                <ff-splitter direction="vertical"></ff-splitter>
                <div class="ff-splitter-section" style="flex-basis: 70%">
                    ${detailView}
                </div>
            </div>
        </div>`;
    }

    /** Selecting the selected derivative again loads it */
    protected onSelectDerivative(event: ISelectDerivativeEvent)
    {
        const derivative = event.detail.derivative;
        const model = this.activeNode?.model;
        if (!model) return;
        const selected = this.getSelected(model);

        if (derivative === selected) {
            this.activate(derivative);
        }
        this.selectedDerivative = derivative;
        this.requestUpdate();
    }

    protected onActivateDerivative(event: IActivateDerivativeEvent)
    {
        this.activate(event.detail.derivative);
    }

    /** Asks the model to display this derivative, unless it is already, or about to be */
    protected activate(derivative: Derivative)
    {
        const model = this.activeNode?.model;
        if (!model || derivative.data.usage !== EDerivativeUsage.Web3D || this.getState(model, derivative) === "loaded" || derivative.state === "loading") {
            return;
        }
        // The derivative reports its progress through its "state" event
        model.ins.quality.setValue(derivative.data.quality);
    }

    protected onActiveNode(previous: NVNode, next: NVNode)
    {
        this.selectedDerivative = null;
        this.unwatchAll();

        // Whether a derivative is on display changes with these
        if (previous && previous.model) {
            previous.model.outs.quality.off("value", this.onUpdate, this);
            previous.model.outs.updated.off("value", this.onUpdate, this);
        }
        if (next && next.model) {
            next.model.outs.quality.on("value", this.onUpdate, this);
            next.model.outs.updated.on("value", this.onUpdate, this);
        }

        super.onActiveNode(previous, next);
    }
}
