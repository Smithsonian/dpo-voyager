/**
 * FF Typescript Foundation Library
 * Copyright 2020 Ralph Wiedemeier, Frame Factory GmbH
 *
 * License: MIT
 */

import CustomElement, { customElement, html, property } from "@ff/ui/CustomElement";

import "@ff/ui/IndexButton";
import { IButtonClickEvent } from "@ff/ui/Button";

import "./ViewCube";

import { EProjection } from "../UniversalCamera";

////////////////////////////////////////////////////////////////////////////////

export { EProjection };
export enum EViewPreset { Left, Right, Top, Bottom, Front, Back, None }

/**
 * Emitted by [[CameraControl]] after the user selects a projection option.
 * @event
 */
export interface IProjectionSelectEvent extends CustomEvent
{
    type: "select";
    bubbles: true;
    target: CameraControls;

    detail: {
        projection: EProjection;
    }
}

/**
 * Displays camera controls, including a view cube to select a preset view,
 * and buttons to select a projection type (perspective or orthographic).
 *
 * ### Events
 * - *"select"* emits [[IProjectionSelectEvent]] after the user selects a projection option.
 */
@customElement("ff-camera-controls")
export default class CameraControls extends CustomElement
{
    @property({ attribute: false })
    preset: EViewPreset = EViewPreset.None;

    @property({ attribute: false })
    projection: EProjection = EProjection.Perspective;


    protected firstConnected()
    {
        this.classList.add("ff-camera-controls");
    }

    protected render()
    {
        return html`
            <ff-view-cube .preset=${this.preset}></ff-view-cube>
            
            <ff-index-button index=${EProjection.Perspective} selectedIndex=${this.projection}
                icon="fa fa-camera" title="Perspective Projection" @click=${this.onClickProjection}></ff-index-button>
            <ff-index-button index=${EProjection.Orthographic} selectedIndex=${this.projection}
                icon="fa fa-camera" title="Orthographic Projection" @click=${this.onClickProjection}></ff-index-button>
        `;
    }

    protected onClickProjection(event: IButtonClickEvent)
    {
        event.stopPropagation();
        const projection = event.target.index;

        this.dispatchEvent(new CustomEvent("select", {
            bubbles: true,
            detail: {
                projection
            }
        }) as IProjectionSelectEvent)
    }
}