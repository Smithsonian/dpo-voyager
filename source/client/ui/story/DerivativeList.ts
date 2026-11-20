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

import CustomElement, { customElement, property, html, TemplateResult } from "@ff/ui/CustomElement";
import "@ff/ui/Icon";

import Derivative, { EDerivativeUsage, EDerivativeQuality, EAssetType } from "../../models/Derivative";
import { formatNumber } from "../../utils/assetStats";

////////////////////////////////////////////////////////////////////////////////

export interface ISelectDerivativeEvent extends CustomEvent
{
    target: DerivativeList;
    detail: {
        derivative: Derivative;
    }
}

/** Lists derivatives grouped by usage. Selecting one shows its details elsewhere. */
@customElement("sv-derivative-list")
class DerivativeList extends CustomElement
{
    @property({ attribute: false })
    data: Readonly<Derivative[]> = null;

    @property({ attribute: false })
    selectedItem: Derivative = null;

    /** The derivative on display in the scene */
    @property({ attribute: false })
    loadedItem: Derivative = null;

    protected firstConnected()
    {
        // Same look as the other panels' lists: see .ff-list in ff-ui
        this.classList.add("ff-list", "sv-derivative-list");
    }

    protected render()
    {
        if (!this.data || this.data.length === 0) {
            return null;
        }

        const groups = new Map<EDerivativeUsage, Derivative[]>();
        for (const derivative of this.data) {
            const usage = derivative.data.usage;
            if (!groups.has(usage)) groups.set(usage, []);
            groups.get(usage).push(derivative);
        }

        return html`${[...groups.keys()].sort((a, b) => a - b).map(usage => html`
            <section class="sv-derivative-group">
                <header class="sv-label">${EDerivativeUsage[usage]}</header>
                ${groups.get(usage).map(derivative => this.renderDerivative(derivative))}
            </section>`)}`;
    }

    protected renderDerivative(derivative: Derivative): TemplateResult
    {
        const isLoaded = derivative === this.loadedItem;
        const asset = derivative.findAsset(EAssetType.Model) ?? derivative.data.assets[0];
        const byteSize = asset?.data.byteSize;

        return html`<div class="ff-list-item ff-flex-row ff-flex-centered sv-derivative" ?selected=${derivative === this.selectedItem}
                @click=${() => this.onClickItem(derivative)}>
            <span class="ff-flex-item-fixed sv-derivative-quality">${EDerivativeQuality[derivative.data.quality]}</span>
            <span class="ff-flex-item-stretch ff-ellipsis" title=${asset?.data.uri ?? ""}>${asset?.data.uri ?? ""}</span>
            ${byteSize ? html`<span class="ff-flex-item-fixed">${formatNumber(byteSize, { unit: "B" })}</span>` : null}
            <span class="ff-flex-item-fixed sv-derivative-loaded">${isLoaded ? html`<ff-icon name="check" title="Loaded"></ff-icon>` : null}</span>
        </div>`;
    }

    protected onClickItem(derivative: Derivative)
    {
        this.dispatchEvent(new CustomEvent("select", {
            detail: { derivative }
        }));
    }
}
