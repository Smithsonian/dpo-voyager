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
import ManipTarget from "@ff/react/ManipTarget";

import PresentationSystem from "../system/PresentationSystem";
import PresentationController from "../controllers/PresentationController";
import PresentationOverlay from "./PresentationOverlay";
import ViewportLayoutSplitter from "./ViewportLayoutSplitter";

////////////////////////////////////////////////////////////////////////////////

/** Properties for [[PresentationView]] component. */
export interface IPresentationViewProps
{
    className?: string;
    system: PresentationSystem;
    controller: PresentationController;
}

export default class PresentationView extends React.Component<IPresentationViewProps, {}>
{
    static readonly defaultProps = {
        className: "presentation-view"
    };

    private _renderer: THREE.WebGLRenderer;
    private _containerRef: React.RefObject<Container>;

    constructor(props: IPresentationViewProps)
    {
        super(props);

        this.onCanvas = this.onCanvas.bind(this);
        this.onCanvasResize = this.onCanvasResize.bind(this);

        this._renderer = null;
        this._containerRef = React.createRef();
    }

    get container(): Container | null
    {
        return this._containerRef.current;
    }

    get renderer(): THREE.WebGLRenderer | null
    {
        return this._renderer;
    }

    componentDidMount()
    {
        this.props.controller.addView(this);
    }

    componentWillUnmount()
    {
        this.props.controller.removeView(this);
    }

    render()
    {
        const {
            className,
            system,
            controller
        } = this.props;

        return (
            <ManipTarget
                className={className}
                handler={system}>

                <Canvas
                    onCanvas={this.onCanvas}
                    onResize={this.onCanvasResize} />

                <Container
                    ref={this._containerRef} />

                <PresentationOverlay
                    actions={controller.actions} />

                <ViewportLayoutSplitter />

            </ManipTarget>
        );
    }

    protected onCanvas(event: ICanvasEvent)
    {
        if (this._renderer) {
            this._renderer.dispose();
            this._renderer = null;
        }

        if (event.canvas) {
            this._renderer = new THREE.WebGLRenderer({
                canvas: event.canvas,
                antialias: true
            });

            this._renderer.autoClear = false;
        }
    }

    protected onCanvasResize(event: ICanvasResizeEvent)
    {
        if (this._renderer) {
            this._renderer.setSize(event.width, event.height, false);
        }

        this.props.controller.setCanvasSize(event.width, event.height);
    }
}