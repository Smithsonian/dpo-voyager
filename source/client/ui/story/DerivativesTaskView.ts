/**
 * 3D Foundation Project
 * Copyright 2019 Smithsonian Institution
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
import "@ff/ui/Icon";

import { EDerivativeQuality, EDerivativeUsage } from "client/schema/model";

import CVDerivativesTask from "../../components/CVDerivativesTask";
import { TaskView } from "../../components/CVTask";

import "./DerivativeList";
import { ISelectDerivativeEvent } from "./DerivativeList";
import NVNode from "client/nodes/NVNode";
import CVLanguageManager from "client/components/CVLanguageManager";
import DerivativeMenu from "./DerivativeMenu";
import Notification from "@ff/ui/Notification";
import CSelection from "@ff/graph/components/CSelection";

////////////////////////////////////////////////////////////////////////////////

@customElement("sv-derivatives-task-view")
export default class DerivativesTaskView extends TaskView<CVDerivativesTask>
{
    get model(){
        return this.activeNode?.model;
    }
    protected render()
    {
        const model = this.model;

        if (!model) {
            return html`<div class="sv-placeholder">Please select a model node to inspect its derivatives</div>`;
        }

        const derivatives = model.derivatives.getArray();

        const requestedQuality = model.ins.quality.value;
        const activeDerivative = model.derivatives.get(EDerivativeUsage.Web3D, requestedQuality);

        const loadedQuality = model.outs.quality.value;
        const loadedDerivative = model.derivatives.get(EDerivativeUsage.Web3D, loadedQuality);
        return html`
            <div class="ff-flex-row ff-flex-wrap">
                <ff-button @click=${this.onAddDerivative} icon="create" text="Add Derivative"></ff-button>
            </div>
            <sv-derivative-list .data=${derivatives} .selectedItem=${activeDerivative} .loadedItem=${loadedDerivative} @remove=${this.onRemoveDerivative} @select=${this.onSelectDerivative}></sv-derivative-list>
        `
    }

    protected onSelectDerivative(event: ISelectDerivativeEvent)
    {
        if(event.detail.derivative) {
            const model = this.activeNode.model;
            model.ins.quality.setValue(event.detail.derivative.data.quality);
        }
    }
    protected onRemoveDerivative(ev:ISelectDerivativeEvent){
        this.activeNode.model.derivatives.remove(ev.detail.derivative.data.usage, ev.detail.derivative.data.quality);
        this.requestUpdate();
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

    protected onAddDerivative(event :MouseEvent){
        DerivativeMenu.show(this, this.system).then(([usage, quality, asset])=>{
            let filepath = asset.info.path;
            console.log("Add derivative :", EDerivativeQuality[quality], asset);
            this.model.derivatives.remove(EDerivativeUsage.Web3D, quality);
            this.model.derivatives.createModelAsset(filepath, quality)
            this.model.ins.quality.setValue(quality);
            this.model.outs.updated.set();
            this.system.getMainComponent(CSelection).selectNode(this.model.node);
        }).catch(e=>{if(e) Notification.show("Failed to add derivative : "+e.message, "error")});
    }
}