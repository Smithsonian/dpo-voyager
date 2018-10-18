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

import PresentationOverlay from "./PresentationOverlay";
import QuadSplitOverlay, { IQuadSplitOverlayChangeEvent } from "./QuadSplitOverlay";
import ViewportLayout, { EViewportLayoutMode, IViewportLayoutChangeEvent } from "../app/ViewportLayout";
import ViewManager from "../app/ViewManager";

////////////////////////////////////////////////////////////////////////////////

/** Properties for [[VoyagerView]] component. */
export interface IVoyagerViewProps
{
    className?: string;
    viewManager: ViewManager;
    system: System;
}

export default class VoyagerView extends React.Component<IVoyagerViewProps, {}> implements IManipEventHandler
{
    static readonly defaultProps = {
        className: "voyager-view"
    };

    renderer: THREE.WebGLRenderer = null;
    viewportLayout: ViewportLayout = null;

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
    }

    get container(): Container | null
    {
        return this.containerRef.current;
    }

    componentDidMount()
    {
        this.viewportLayout = this.props.viewManager.registerView(this);
        this.viewportLayout.on("layout", this.onLayout, this);
        this.forceUpdate();
    }

    componentWillUnmount()
    {
        this.props.viewManager.unregisterView(this);
        this.viewportLayout.off("layout", this.onLayout, this);
        this.viewportLayout = null;
    }

    render()
    {
        const {
            className,
            system
        } = this.props;

        const viewportLayout = this.viewportLayout;

        const layoutMode = viewportLayout ? viewportLayout.layoutMode : EViewportLayoutMode.Single;
        const horizontalSplit = viewportLayout ? viewportLayout.horizontalSplit : 0.5;
        const verticalSplit = viewportLayout ? viewportLayout.verticalSplit : 0.5;

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
                    system={system} />

                <QuadSplitOverlay
                    mode={layoutMode}
                    horizontalSplit={horizontalSplit}
                    verticalSplit={verticalSplit}
                    onChange={this.onQuadSplitChange}
                />
            </ManipTarget>
        );
    }

    onPointer(event: IManipPointerEvent)
    {
        if (this.viewportLayout) {
            return this.viewportLayout.onPointer(event);
        }

        return false;
    }

    onTrigger(event: IManipTriggerEvent)
    {
        if (this.viewportLayout) {
            return this.viewportLayout.onTrigger(event);
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

        if (this.viewportLayout) {
            this.viewportLayout.setCanvasSize(event.width, event.height);
        }
    }

    protected onLayout(event: IViewportLayoutChangeEvent)
    {
        this.forceUpdate();
    }

    protected onQuadSplitChange(event: IQuadSplitOverlayChangeEvent)
    {
        if (this.viewportLayout) {
            this.viewportLayout.setSplit(event.horizontalSplit, event.verticalSplit);
        }
    }
}