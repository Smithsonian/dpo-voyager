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
import { CSSProperties } from "react";

import * as THREE from "three";

import Manip from "@ff/react/Manip.old";
import Scene from "./Scene";

export interface ICanvas3DProps
{
    className?: string;
    style?: CSSProperties;
    scene?: Scene;
    play?: boolean;
}

export interface ICanvas3DState
{
    scene: Scene;
    isPlaying: boolean;
}

export default class Canvas3D extends React.Component<ICanvas3DProps, ICanvas3DState>
{
    static defaultProps: ICanvas3DProps = {
        className: "canvas-3d",
        scene: null,
        play: true
    };

    private static canvasStyle: CSSProperties = {
        display: "block",
        width: "100%",
        height: "100%"
    };

    protected canvas: HTMLCanvasElement;
    protected renderer: THREE.WebGLRenderer;
    protected animHandler: number;

    constructor(props: ICanvas3DProps)
    {
        super(props);

        this.state = {
            scene: null,
            isPlaying: props.play
        };

        this.onRef = this.onRef.bind(this);
        this.onAnimationFrame = this.onAnimationFrame.bind(this);
        this.onResize = this.onResize.bind(this);
    }

    start()
    {
        this.setState({
            isPlaying: true
        });
    }

    stop()
    {
        cancelAnimationFrame(this.animHandler);

        this.setState({
            isPlaying: false
        });
    }

    advance()
    {
        if (this.animHandler === 0) {
            this.state.scene.render();
        }
    }

    render()
    {
        const {
            className,
            style,
            scene
        } = this.props;

        if (this.animHandler === 0) {
            this.onAnimationFrame();
        }

        return (<Manip
            style={style}
            listener={scene} >
            <canvas
                className={className}
                style={Canvas3D.canvasStyle}
                ref={this.onRef} />
        </Manip>);
    }

    protected onRef(canvas: HTMLCanvasElement)
    {
        this.canvas = canvas;

        if (canvas) {
            this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
            this.props.scene.initialize(this.renderer);
            this.setState({ scene: this.props.scene });


            window.addEventListener("resize", this.onResize);
            this.onResize();

            this.onAnimationFrame();
        }
        else {
            cancelAnimationFrame(this.animHandler);
            window.removeEventListener("resize", this.onResize);

            this.renderer = null;
        }
    }

    protected onAnimationFrame()
    {
        const state = this.state;

        if (!state.isPlaying) {
            return;
        }

        this.animHandler = requestAnimationFrame(this.onAnimationFrame);

        if (state.scene) {
            state.scene.render();
        }
    }

    protected onResize()
    {
        if (!this.canvas) {
            return;
        }

        const width = this.canvas.clientWidth;
        const height = this.canvas.clientHeight;

        this.renderer.setSize(width, height, false);
        this.renderer.setPixelRatio(window.devicePixelRatio);

        if (this.props.scene) {
            this.props.scene.resize(width, height);
        }
    }
}