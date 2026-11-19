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
import "@ff/ui/Button";

import CVLanguageManager from "../../components/CVLanguageManager";
import Derivative, { EDerivativeUsage, EDerivativeQuality } from "../../models/Derivative";
import { getAssetStats, formatNumber, TextureStats } from "../../utils/assetStats";

////////////////////////////////////////////////////////////////////////////////

export type TDerivativeState = "idle" | "loading" | "loaded" | "error";

export interface IActivateDerivativeEvent extends CustomEvent
{
    target: DerivativeDetails;
    detail: {
        derivative: Derivative;
    }
}

/** Display names for material slots. Others lose their "Map" suffix: "bumpMap" gives "bump" */
const slotLabels: Record<string, string> = {
    map: "diffuse",
    aoMap: "occlusion",
    metalnessMap: "metallic",
    roughnessMap: "roughness",
};

const slotLabel = (slot: string) => slotLabels[slot] ?? slot.replace(/Map$/, "");

/** "ktx2/uastc" gives "ktx2-uastc", usable in a class name */
const formatClass = (format: string) => format.toLowerCase().replace(/[^a-z0-9]+/g, "-");

/**
 * Details of one derivative: whether it is the one on display, a button to make it so, and its stats.
 * Only Web3D derivatives can be displayed in the scene.
 */
@customElement("sv-derivative-details")
class DerivativeDetails extends CustomElement
{
    @property({ attribute: false })
    derivative: Derivative | null = null;

    @property({ attribute: false })
    state: TDerivativeState = "idle";

    @property({ attribute: false })
    error: Error | null = null;

    /** For translations. Without it, text is shown as is */
    @property({ attribute: false })
    languageManager: CVLanguageManager | null = null;

    protected firstConnected()
    {
        this.classList.add("ff-flex-column", "sv-derivative-details");
    }

    protected render()
    {
        const derivative = this.derivative;
        if (!derivative) {
            return null;
        }

        const activatable = derivative.data.usage === EDerivativeUsage.Web3D;
        const state = this.state;

        // The button and the status take the same spot: one or the other
        const canActivate = activatable && (state === "idle" || state === "error");
        const status = state === "loading" ? "Loading…" : state === "loaded" ? "Loaded" : null;

        return html`<div class="ff-flex-row ff-flex-wrap ff-flex-centered sv-derivative-header">
                <div class="sv-label">${EDerivativeUsage[derivative.data.usage]} / ${EDerivativeQuality[derivative.data.quality]}</div>
                ${canActivate ? html`<ff-button class="sv-derivative-activate" text=${state === "error" ? "Retry" : "Make active"} @click=${this.onClickActivate}></ff-button>`
                    : activatable && status ? html`<span class="sv-derivative-state sv-state-${state}" role="status">${status}</span>` : null}
            </div>
            ${state === "error" ? html`<div class="sv-derivative-error" role="alert">Failed to load${this.error?.message ? `: ${this.error.message}` : ""}</div>` : null}
            ${this.renderStats(derivative)}`;
    }

    /** Translated with the scene's UI language when a language manager is given */
    protected localize(text: string): string
    {
        return this.languageManager ? this.languageManager.getUILocalizedString(text) : text;
    }

    /** A name and a value: a line of the settings panel's tree (see SettingsTaskView) */
    protected renderRow(name: string, value: unknown): TemplateResult
    {
        return html`<div class="ff-tree-node-container"><div class="ff-tree-node ff-leaf"><div class="ff-header">
            <div class="sv-property-view sv-derivative-row"><div class="sv-property-name">${name}</div><div class="sv-property"><div class="ff-flex-spacer"></div>${value}</div></div>
        </div></div></div>`;
    }

    /** A titled group of rows, like a component's properties in the settings panel */
    protected renderSection(title: string, rows: unknown): TemplateResult
    {
        return html`<div class="ff-tree-node-container"><div class="ff-tree-node ff-component" expanded>
            <div class="ff-header"><div class="ff-text ff-label ff-ellipsis">${title}</div></div>
            <div class="ff-content">${rows}</div>
        </div></div>`;
    }

    protected renderStats(derivative: Derivative): TemplateResult
    {
        const stats = getAssetStats(derivative);
        const measured = stats.measured;

        const faces = measured ? measured.faceCount : stats.declared.numFaces;
        const textures = measured ? measured.textures : [];
        const hasTextures = measured ? textures.length > 0 : !!stats.declared.imageSize;

        return html`<div class="ff-tree ff-property-tree ff-flex-item-fixed">
            ${faces ? this.renderSection(this.localize("Geometry"), html`
                ${measured ? this.renderRow(this.localize("Vertices"), formatNumber(measured.vertexCount)) : null}
                ${this.renderRow(this.localize("Faces"), formatNumber(faces))}`) : null}
            ${hasTextures ? this.renderSection(this.localize("Textures"), measured
                ? textures.map(texture => this.renderRow(texture.slots.map(slotLabel).join(", "), html`<span>${texture.width}×${texture.height}
                    <span class="sv-format sv-format-${formatClass(texture.format)}">${texture.format}</span></span>`))
                : this.renderRow(this.localize("Size"), `${stats.declared.imageSize}²`)) : null}
        </div>
        ${measured ? null : html`<div class="sv-label-right">asset not loaded</div>`}`;
    }

    protected onClickActivate()
    {
        this.dispatchEvent(new CustomEvent("activate", {
            detail: { derivative: this.derivative }
        }));
    }
}
