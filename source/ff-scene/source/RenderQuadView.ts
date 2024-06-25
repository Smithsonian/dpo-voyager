/**
 * FF Typescript Foundation Library
 * Copyright 2019 Ralph Wiedemeier, Frame Factory GmbH
 *
 * License: MIT
 */

import { ITypedEvent } from "@ff/core/Publisher";
import System from "@ff/graph/System";

import Viewport from "@ff/three/Viewport";
import { EViewPreset, EProjection } from "@ff/three/UniversalCamera";

import RenderView, { IPointerEvent, ITriggerEvent } from "./RenderView";

////////////////////////////////////////////////////////////////////////////////

export { IPointerEvent, ITriggerEvent };

export enum EQuadViewLayout { Single, HorizontalSplit, VerticalSplit, Quad }

export interface ILayoutChange extends ITypedEvent<"layout">
{
    layout: EQuadViewLayout;
}

export default class RenderQuadView extends RenderView
{
    private _layout: EQuadViewLayout = EQuadViewLayout.Quad;
    private _horizontalSplit = 0.5;
    private _verticalSplit = 0.5;

    constructor(system: System, canvas: HTMLCanvasElement, overlay: HTMLElement)
    {
        super(system, canvas, overlay);
        this.addEvent("layout");

        this.layout = EQuadViewLayout.Single;
    }

    set layout(layout: EQuadViewLayout) {

        if (layout === this._layout) {
            return;
        }

        this._layout = layout;
        const viewports = this.viewports;

        switch (this._layout) {
            case EQuadViewLayout.Single:
                this.setViewportCount(1);
                break;

            case EQuadViewLayout.HorizontalSplit:
            case EQuadViewLayout.VerticalSplit:
                this.setViewportCount(2);
                break;

            case EQuadViewLayout.Quad:
                this.setViewportCount(4);
                break;
        }

        this.updateSplitPositions();

        if (viewports[1]) {
            viewports[1].setBuiltInCamera(EProjection.Orthographic, EViewPreset.Top);
            viewports[1].enableCameraControl(true).orientationEnabled = false;
        }

        if (viewports[2]) {
            viewports[2].setBuiltInCamera(EProjection.Orthographic, EViewPreset.Left);
            viewports[2].enableCameraControl(true).orientationEnabled = false;
        }

        if (viewports[3]) {
            viewports[3].setBuiltInCamera(EProjection.Orthographic, EViewPreset.Front);
            viewports[3].enableCameraControl(true).orientationEnabled = false;
        }

        this.emit<ILayoutChange>({ type: "layout", layout });
    }

    get layout() {
        return this._layout;
    }

    set horizontalSplit(value: number) {
        this._horizontalSplit = value;
        this.updateSplitPositions();
    }

    get horizontalSplit() {
        return this._horizontalSplit;
    }

    set verticalSplit(value: number) {
        this._verticalSplit = value;
        this.updateSplitPositions();
    }

    get verticalSplit() {
        return this._verticalSplit;
    }

    protected updateSplitPositions()
    {
        const h = this._horizontalSplit;
        const v = this._verticalSplit;

        switch (this._layout) {
            case EQuadViewLayout.Single:
                this.viewports[0].setSize(0, 0, 1, 1);
                break;

            case EQuadViewLayout.HorizontalSplit:
                this.viewports[0].setSize(0, 0, h, 1);
                this.viewports[1].setSize(h, 0, 1-h, 1);
                break;

            case EQuadViewLayout.VerticalSplit:
                this.viewports[0].setSize(0, 1-v, 1, v);
                this.viewports[1].setSize(0, 0, 1, 1-v);
                break;

            case EQuadViewLayout.Quad:
                this.viewports[0].setSize(0, 1-v, h, v);
                this.viewports[1].setSize(h, 1-v, 1-h, v);
                this.viewports[2].setSize(0, 0, h, 1-v);
                this.viewports[3].setSize(h, 0, 1-h, 1-v);
                break;
        }
    }
}