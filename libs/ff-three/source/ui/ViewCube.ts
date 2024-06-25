/**
 * FF Typescript Foundation Library
 * Copyright 2020 Ralph Wiedemeier, Frame Factory GmbH
 *
 * License: MIT
 */

import CustomElement, { customElement, html, property } from "@ff/ui/CustomElement";
import "@ff/ui/IndexButton";
import { IButtonClickEvent } from "@ff/ui/Button";

import { EViewPreset } from "./CameraControls";

////////////////////////////////////////////////////////////////////////////////

/**
 * Emitted by [[ViewCube]] after the user selects a view preset.
 * @event
 */
export interface IViewCubeSelectEvent extends CustomEvent
{
    type: "select";
    bubbles: true;
    target: ViewCube;

    detail: {
        preset: EViewPreset;
    }
}

/**
 * Displays a view cube. This is an unfolded cube, each of the six sides represents
 * a view direction: left, right, top, bottom, front, back.
 *
 * ### Events
 * - *"select"* emits [[IViewCubeSelectEvent]] after the user selects a view preset.
 */
@customElement("ff-view-cube")
export default class ViewCube extends CustomElement
{
    @property({ attribute: false })
    preset: EViewPreset = EViewPreset.None;

    protected firstConnected()
    {
        this.setStyle({
            display: "grid",
            justifyContent: "center"
        });

        this.classList.add("ff-view-cube");

        this.onClick = this.onClick.bind(this);
        this.addEventListener("click", this.onClick);
    }

    protected render()
    {
        const preset = this.preset;

        return html`
            <ff-index-button .index=${EViewPreset.Top} .selectedIndex=${preset}
              text="T" title="Top View" style="grid-column-start: 2; grid-row-start: 1;"></ff-index-button>
            <ff-index-button .index=${EViewPreset.Left} .selectedIndex=${preset}
              text="L" title="Left View" style="grid-column-start: 1; grid-row-start: 2;"></ff-index-button>
            <ff-index-button .index=${EViewPreset.Front} .selectedIndex=${preset}
              text="F" title="Front View" style="grid-column-start: 2; grid-row-start: 2;"></ff-index-button>
            <ff-index-button .index=${EViewPreset.Right} .selectedIndex=${preset}
              text="R" title="Right View" style="grid-column-start: 3; grid-row-start: 2;"></ff-index-button>
            <ff-index-button .index=${EViewPreset.Back} .selectedIndex=${preset}
              text="B" title="Back View" style="grid-column-start: 4; grid-row-start: 2;"></ff-index-button>
            <ff-index-button .index=${EViewPreset.Bottom} .selectedIndex=${preset}
              text="B" title="Bottom View" style="grid-column-start: 2; grid-row-start: 3;"></ff-index-button>
        `;
    }

    protected onClick(event: IButtonClickEvent)
    {
        event.stopPropagation();
        const preset = event.target.index;

        this.dispatchEvent(new CustomEvent("select", {
            bubbles: true,
            detail: {
                preset
            }
        }) as IViewCubeSelectEvent);
    }
}