/**
 * FF Typescript Foundation Library
 * Copyright 2020 Ralph Wiedemeier, Frame Factory GmbH
 *
 * License: MIT
 */

import { Dictionary } from "@ff/core/types";
import CustomElement, { customElement, html } from "@ff/ui/CustomElement";

////////////////////////////////////////////////////////////////////////////////

/** Location enumeration for [[ViewportOverlay]]. */
export enum ELocation { TopLeft, TopCenter, TopRight, BottomLeft, BottomCenter, BottomRight }

interface ILabel
{
    text: string;
    className: string;
}

/**
 * Custom HTML Element to be used as an overlay on top of a viewport.
 * Labels can be added to the overlay in six different locations. Each label is associated
 * with a key. Use the key to change or remove the label. Each label can be styled differently
 * using custom CSS classes.
 */
@customElement("ff-viewport-overlay")
export default class ViewportOverlay extends CustomElement
{
    protected labels: Dictionary<ILabel>[] = [];

    constructor()
    {
        super();
        this.labels.push({}, {}, {}, {}, {}, {});
    }

    setLabel(location: ELocation, key: string, text: string, className?: string)
    {
        this.labels[location][key] = { text, className };
        this.requestUpdate();
    }

    unsetLabel(location: ELocation, key: string)
    {
        delete this.labels[location][key];
        this.requestUpdate();
    }

    protected firstConnected()
    {
        this.classList.add("ff-container", "ff-viewport-overlay");
    }

    protected render()
    {
        const labels = this.labels;

        return html`<div class="ff-row">
            <div class="ff-labels ff-top-left">${Object.keys(labels[ELocation.TopLeft]).map(key => {
                    const label = labels[ELocation.TopLeft][key];
                    return html`<div class=${"ff-label " + label.className || ""}>${label.text}</div>`;
            })}</div>
            <div class="ff-labels ff-top-center">${Object.keys(labels[ELocation.TopCenter]).map(key => {
                const label = labels[ELocation.TopCenter][key];
                return html`<div class=${"ff-label " + label.className || ""}>${label.text}</div>`;
            })}</div>
            <div class="ff-labels ff-top-right">${Object.keys(labels[ELocation.TopRight]).map(key => {
                const label = labels[ELocation.TopRight][key];
                return html`<div class=${"ff-label " + label.className || ""}>${label.text}</div>`;
            })}</div>
        </div><div class="ff-row">
            <div class="ff-labels ff-bottom-left">${Object.keys(labels[ELocation.BottomLeft]).map(key => {
                const label = labels[ELocation.BottomLeft][key];
                return html`<div class=${"ff-label " + label.className || ""}>${label.text}</div>`;
            })}</div>
            <div class="ff-labels ff-bottom-center">${Object.keys(labels[ELocation.BottomCenter]).map(key => {
                const label = labels[ELocation.BottomCenter][key];
                return html`<div class=${"ff-label " + label.className || ""}>${label.text}</div>`;
            })}</div>
            <div class="ff-labels ff-bottom-right">${Object.keys(labels[ELocation.BottomRight]).map(key => {
                const label = labels[ELocation.BottomRight][key];
                return html`<div class=${"ff-label " + label.className || ""}>${label.text}</div>`;
            })}</div>
        </div>`;
    }
}