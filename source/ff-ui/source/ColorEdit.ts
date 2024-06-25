/**
 * FF Typescript Foundation Library
 * Copyright 2019 Ralph Wiedemeier, Frame Factory GmbH
 *
 * License: MIT
 */

import math from "@ff/core/math";
import Color, { Vector3 } from "@ff/core/Color";

import "./LineEdit";
import { ILineEditChangeEvent } from "./LineEdit";
import LinearSlider, { ILinearSliderChangeEvent} from "./LinearSlider";
import VectorSlider, { IVectorSliderChangeEvent } from "./VectorSlider";

import CustomElement, { customElement, html, property, PropertyValues } from "./CustomElement";

////////////////////////////////////////////////////////////////////////////////

const _hueColor = new Color();

export { Color };

export interface IColorEditChangeEvent extends CustomEvent
{
    type: "change";
    target: ColorEdit;
    detail: {
        color: Color;
        isDragging: boolean;
    }
}

@customElement("ff-color-edit")
export default class ColorEdit extends CustomElement
{
    @property({ attribute: false })
    color = new Color();

    @property({ type: Boolean })
    alpha = false;

    @property({ type: Boolean })
    numeric = false;

    private _hsv: Vector3;
    private _lumSatSlider: VectorSlider;
    private _hueSlider: LinearSlider;
    private _alphaSlider: LinearSlider;

    constructor()
    {
        super();

        this.onLumSatChange = this.onLumSatChange.bind(this);
        this.onHueChange = this.onHueChange.bind(this);
        this.onAlphaChange = this.onAlphaChange.bind(this);

        this.addEventListener("click", e => e.stopPropagation());

        this._hsv = new Vector3();
        this._lumSatSlider = new VectorSlider().on("change", this.onLumSatChange);
        this._hueSlider = new LinearSlider().addClass("ff-hue-slider").on("change", this.onHueChange);
        this._hueSlider.direction = "vertical";
    }

    protected firstConnected()
    {
        this.classList.add("ff-flex-column", "ff-control", "ff-color-edit");
    }

    protected update(changedProperties: PropertyValues): void
    {
        if (changedProperties.has("color")) {
            this.color.toHSV(this._hsv);
        }
        if (changedProperties.has("alpha")) {
            if (this.alpha && !this._alphaSlider) {
                this._alphaSlider = new LinearSlider().addClass("ff-alpha-slider").on("change", this.onAlphaChange);
                this._alphaSlider.direction = "vertical";
            }
            else if (!this.alpha && this._alphaSlider) {
                this._alphaSlider.remove();
            }
        }

        super.update(changedProperties);
    }

    protected render()
    {
        let numericControls = null;

        if (this.numeric) {
            const color = this.color;
            const hex = color.toString(false).substr(1);

            const alphaControl = this.alpha ? html`
                <div class="ff-text">A</div><ff-line-edit name="alphaByte" text=${color.alphaByte} align="center" @change=${this.onNumericEdit}></ff-line-edit>
            ` : null;

            numericControls = html`<div class="ff-flex-row ff-numeric-controls">
                <div class="ff-text">R</div><ff-line-edit name="redByte" text=${color.redByte} align="center" @change=${this.onNumericEdit}></ff-line-edit>
                <div class="ff-text">G</div><ff-line-edit name="greenByte" text=${color.greenByte} align="center" @change=${this.onNumericEdit}></ff-line-edit>
                <div class="ff-text">B</div><ff-line-edit name="blueByte" text=${color.blueByte} align="center" @change=${this.onNumericEdit}></ff-line-edit>
                ${alphaControl}
                <div class="ff-text">#</div><ff-line-edit name="string" text=${hex} class="ff-wide" align="center" @change=${this.onNumericEdit}></ff-line-edit>
            </div>`;
        }


        return html`<div class="ff-flex-row ff-slider-controls" role="application" @keydown=${this.onKeyDown}>
                ${this._lumSatSlider}${this._hueSlider}${this._alphaSlider}
            </div>${numericControls}`;
    }

    protected updated()
    {
        this._hueSlider.value = 1 - this._hsv.x / 360;

        const hue = _hueColor.setHSV(this._hsv.x).toString(false);
        const slGrad = `linear-gradient(to bottom, transparent, black), linear-gradient(to right, white, ${hue})`;
        this._lumSatSlider.style.backgroundImage = slGrad;
        this._lumSatSlider.setXY(this._hsv.y, this._hsv.z);

        if (this.alpha) {
            const color = this.color.toString(/* includeAlpha */ false);
            const fg = getComputedStyle(this._alphaSlider).color;
            const alphaGrad = `linear-gradient(to top, transparent, ${color}), repeating-linear-gradient(-45deg, transparent, transparent 8px, ${fg} 8px, ${fg} 16px)`;
            this._alphaSlider.style.backgroundImage = alphaGrad;
            this._alphaSlider.value = this.color.alpha;
        }
    }

    protected onLumSatChange(event: IVectorSliderChangeEvent)
    {
        event.stopPropagation();

        const value = event.detail.value;
        this._hsv.y = value.x;
        this._hsv.z = value.y;

        this.color.setHSV(this._hsv);
        this.requestUpdate();
        this.emitChangeEvent(event.detail.isDragging);
    }

    protected onHueChange(event: ILinearSliderChangeEvent)
    {
        event.stopPropagation();

        this._hsv.x = (1 - event.target.value) * 360;

        this.color.setHSV(this._hsv);
        this.requestUpdate();
        this.emitChangeEvent(event.detail.isDragging);
    }

    protected onAlphaChange(event: ILinearSliderChangeEvent)
    {
        event.stopPropagation();

        this.color.alpha = event.target.value;

        this.requestUpdate();
        this.emitChangeEvent(event.detail.isDragging);
    }

    protected onNumericEdit(event: ILineEditChangeEvent)
    {
        event.stopPropagation();

        const name = event.target.name;

        if (name === "string") {
            this.color.setString(event.detail.text, 1, false);
        }
        else {
            let value = parseInt(event.detail.text);
            if (!isFinite(value)) {
                return;
            }
            this.color[name] = math.limit(value, 0, 255);
        }

        this.color.toHSV(this._hsv);
        this.requestUpdate();
        this.emitChangeEvent(event.detail.isEditing);
    }

    protected onKeyDown(event: KeyboardEvent)
    {
        const isSmallStepUp = event.code === "ArrowRight" || event.code === "ArrowUp";
        const isLargeStepUp = event.code === "PageUp";
        const isSmallStepDown = event.code === "ArrowLeft" || event.code === "ArrowDown";
        const isLargeStepDown = event.code === "PageDown";
        const shouldStep = isSmallStepUp || isLargeStepUp || isSmallStepDown || isLargeStepDown;

        if(shouldStep) {
            if(event.target === this._hueSlider || event.target === this._alphaSlider) {
                const dir = (isSmallStepUp || isLargeStepUp) ? -1 : 1;
                const step = (isSmallStepUp || isSmallStepDown) ? 0.01 : 0.1;
                if(event.target === this._hueSlider) {
                    this._hsv.x = math.limit(this._hsv.x + step*360*dir, 0, 360);
                    this.color.setHSV(this._hsv);
                }
                else {
                    this.color.alpha = math.limit(this.color.alpha + step*dir, 0, 1);
                }
                this.requestUpdate();
                this.emitChangeEvent(false);
            }
            else if(event.target === this._lumSatSlider) {
                if(isSmallStepUp || isSmallStepDown) {
                    const dir = isSmallStepUp ? 1 : -1;
                    const step = event.shiftKey ? 0.1 : 0.01;
                    if(event.code === "ArrowRight" || event.code === "ArrowLeft") {
                        this._hsv.y = math.limit(this._hsv.y + step*dir, 0, 1);
                    }
                    else {
                        this._hsv.z = math.limit(this._hsv.z + step*dir, 0, 1);
                    }
                    this.color.setHSV(this._hsv);
                    this.requestUpdate();
                    this.emitChangeEvent(false);
                }
            }
        }
    }

    protected emitChangeEvent(isDragging: boolean)
    {
        this.dispatchEvent(new CustomEvent("change", {
            detail: {
                color: this.color,
                isDragging
            },
            bubbles: true
        }));
    }
}