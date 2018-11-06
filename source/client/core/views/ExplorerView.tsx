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

import System from "@ff/core/ecs/System";

import Container from "@ff/react/Container";
import Canvas, { ICanvasEvent, ICanvasResizeEvent } from "@ff/react/Canvas";
import ManipTarget, { IManipEventHandler, IManipPointerEvent, IManipTriggerEvent } from "@ff/react/ManipTarget";

import ViewportManager, { EViewportLayout, IViewportLayoutChangeEvent } from "../app/ViewportManager";
import ViewportController from "../components/ViewportController";

import QuadSplitOverlay, { IQuadSplitOverlayChangeEvent } from "./QuadSplitOverlay";
import ExplorerOverlayView from "./ExplorerOverlayView";

////////////////////////////////////////////////////////////////////////////////

/** Properties for [[ExplorerView]] component. */
export interface IExplorerViewProps
{
    className?: string;
    system: System;
}

export default class ExplorerView extends React.Component<IExplorerViewProps, {}> implements IManipEventHandler
{
    static readonly defaultProps = {
        className: "sv-explorer-view"
    };

    renderer: THREE.WebGLRenderer = null;
    viewportManager: ViewportManager = null;

    canvasWidth: number = 0;
    canvasHeight: number = 0;

    protected containerRef: React.RefObject<Container>;

    constructor(props: IExplorerViewProps)
    {
        super(props);

        this.onCanvas = this.onCanvas.bind(this);
        this.onCanvasResize = this.onCanvasResize.bind(this);
        this.onQuadSplitChange = this.onQuadSplitChange.bind(this);

        this.containerRef = React.createRef();
    }

    get container(): Container | null
    {
        return this.containerRef.current;
    }

    componentWillMount()
    {
        const viewportController = this.props.system.getComponent(ViewportController);

        if (viewportController) {
            this.viewportManager = viewportController.registerView(this);
            this.viewportManager.on("layout", this.onLayout, this);
        }
    }

    componentWillUnmount()
    {
        const viewportController = this.props.system.getComponent(ViewportController);

        if (viewportController) {
            viewportController.unregisterView(this);
            this.viewportManager.off("layout", this.onLayout, this);
            this.viewportManager = null;
        }
    }

    render()
    {
        const {
            className,
            system
        } = this.props;

        const manager = this.viewportManager;

        const layout = manager ? manager.layout : EViewportLayout.Single;
        const horizontalSplit = manager ? manager.horizontalSplit : 0.5;
        const verticalSplit = manager ? manager.verticalSplit : 0.5;

        return (
            <ManipTarget
                className={className}
                handler={this}>

                <Canvas
                    onCanvas={this.onCanvas}
                    onResize={this.onCanvasResize} />

                <Container
                    ref={this.containerRef} />

                <div
                    id="sv-annotations"
                    className="sv-annotations" />

                <ExplorerOverlayView
                    system={system} />

                <QuadSplitOverlay
                    layout={layout}
                    horizontalSplit={horizontalSplit}
                    verticalSplit={verticalSplit}
                    onChange={this.onQuadSplitChange}/>

                <div
                    className="sv-logo">
                    <img src="images/si-dpo3d-logo-neg.svg" />
                </div>
            </ManipTarget>
        );
    }

    onPointer(event: IManipPointerEvent)
    {
        if (this.viewportManager) {
            return this.viewportManager.onPointer(event);
        }

        return false;
    }

    onTrigger(event: IManipTriggerEvent)
    {
        if (this.viewportManager) {
            return this.viewportManager.onTrigger(event);
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

        if (this.viewportManager) {
            this.viewportManager.setCanvasSize(event.width, event.height);
        }
    }

    protected onLayout(event: IViewportLayoutChangeEvent)
    {
        this.forceUpdate();
    }

    protected onQuadSplitChange(event: IQuadSplitOverlayChangeEvent)
    {
        if (this.viewportManager) {
            this.viewportManager.setSplit(event.horizontalSplit, event.verticalSplit);
        }
    }
}