/**
 * 3D Foundation Project
 * Copyright 2018 Smithsonian Institution
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

import * as React from "react";
import * as THREE from "three";

import Container from "@ff/react/Container";
import Canvas, { ICanvasEvent, ICanvasResizeEvent } from "@ff/react/Canvas";
import ManipTarget, { IManipEventHandler, IManipPointerEvent, IManipTriggerEvent } from "@ff/react/ManipTarget";

import PresentationOverlay from "./PresentationOverlay";
import QuadSplitOverlay, { IQuadSplitOverlayChangeEvent, QuadSplitOverlayMode } from "./QuadSplitOverlay";
import ViewManager from "../system/ViewManager";
import ViewportController from "../components/CanvasController";

////////////////////////////////////////////////////////////////////////////////

/** Properties for [[VoyagerView]] component. */
export interface IVoyagerViewProps
{
    className?: string;
    viewManager: ViewManager;
    actions;
}

export interface IVoyagerViewState
{
    canvasController: ViewportController;
}

export default class VoyagerView extends React.Component<IVoyagerViewProps, IVoyagerViewState> implements IManipEventHandler
{
    static readonly defaultProps = {
        className: "voyager-view"
    };

    renderer: THREE.WebGLRenderer = null;
    canvasWidth: number = 0;
    canvasHeight: number = 0;

    protected containerRef: React.RefObject<Container>;

    constructor(props: IVoyagerViewProps)
    {
        super(props);

        this.onCanvas = this.onCanvas.bind(this);
        this.onCanvasResize = this.onCanvasResize.bind(this);
        this.onQuadSplitChange = this.onQuadSplitChange.bind(this);

        this.containerRef = React.createRef();

        this.state = {
            canvasController: null
        };
    }

    get container(): Container | null
    {
        return this.containerRef.current;
    }

    componentDidMount()
    {
        const canvasController = this.props.viewManager.registerView(this);
        this.setState({ canvasController });
    }

    componentWillUnmount()
    {
        this.props.viewManager.unregisterView(this.state.canvasController.id);
        this.setState({ canvasController: null });
    }

    render()
    {
        const {
            className,
            actions
        } = this.props;

        const controller = this.state.canvasController;

        const splitCode = controller ? controller.getValue("Layout") : 0;
        const horizontalSplit = controller ? controller.getValue("Split.Horizontal") : 0.5;
        const verticalSplit = controller ? controller.getValue("Split.Vertical") : 0.5;

        const splitMode = [ "off", "horizontal", "vertical", "quad" ][splitCode] as QuadSplitOverlayMode;

        return (
            <ManipTarget
                className={className}
                handler={this}>

                <Canvas
                    onCanvas={this.onCanvas}
                    onResize={this.onCanvasResize} />

                <Container
                    ref={this.containerRef} />

                <PresentationOverlay
                    actions={actions} />

                <QuadSplitOverlay
                    mode={splitMode}
                    horizontalSplit={horizontalSplit}
                    verticalSplit={verticalSplit}
                    onChange={this.onQuadSplitChange}
                />
            </ManipTarget>
        );
    }

    onPointer(event: IManipPointerEvent)
    {
        const canvasController = this.state.canvasController;
        if (canvasController) {
            return canvasController.onPointer(event);
        }

        return false;
    }

    onTrigger(event: IManipTriggerEvent)
    {
        const canvasController = this.state.canvasController;
        if (canvasController) {
            return canvasController.onTrigger(event);
        }

        return false;
    }

    protected onCanvas(event: ICanvasEvent)
    {
        if (this.renderer) {
            this.renderer.dispose();
            this.renderer = null;
        }

        if (event.canvas) {
            this.renderer = new THREE.WebGLRenderer({
                canvas: event.canvas,
                antialias: true
            });

            this.renderer.autoClear = false;
        }
    }

    protected onCanvasResize(event: ICanvasResizeEvent)
    {
        this.canvasWidth = event.width;
        this.canvasHeight = event.height;

        if (this.renderer) {
            this.renderer.setSize(event.width, event.height, false);
        }

        const canvasController = this.state.canvasController;
        if (canvasController) {
            canvasController.setCanvasSize(event.width, event.height);
        }
    }

    protected onQuadSplitChange(event: IQuadSplitOverlayChangeEvent)
    {
        const canvasController = this.state.canvasController;
        if (canvasController) {
            canvasController.setValue("Split.Horizontal", event.horizontalSplit);
            canvasController.setValue("Split.Vertical", event.verticalSplit);
        }
    }
}