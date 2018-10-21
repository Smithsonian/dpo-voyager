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

import { IComponentProps, IComponentEvent } from "@ff/react/common";
import { ISplitterContainerResizeEvent, SplitterContainer, SplitterSection } from "@ff/react/Splitter";

import { EViewportLayoutMode } from "../app/ViewportLayout";

////////////////////////////////////////////////////////////////////////////////



export interface IQuadSplitOverlayChangeEvent extends IComponentEvent<QuadSplitOverlay>
{
    mode: EViewportLayoutMode;
    horizontalSplit: number;
    verticalSplit: number;
    isDragging: boolean;
}

/** Properties for [[QuadSplitOverlay]] component. */
export interface IQuadSplitOverlayProps extends IComponentProps
{
    mode?: EViewportLayoutMode;
    horizontalSplit?: number;
    verticalSplit?: number;
    onChange?: (event: IQuadSplitOverlayChangeEvent) => void;
}

export default class QuadSplitOverlay extends React.Component<IQuadSplitOverlayProps, {}>
{
    static readonly defaultProps: IQuadSplitOverlayProps = {
        className: "sv-quad-split-overlay",
        mode: EViewportLayoutMode.Single,
        horizontalSplit: 0.5,
        verticalSplit: 0.5
    };

    protected horizontalSplit: number;
    protected verticalSplit: number;

    constructor(props: IQuadSplitOverlayProps)
    {
        super(props);

        this.onHorizontalResize = this.onHorizontalResize.bind(this);
        this.onVerticalResize = this.onVerticalResize.bind(this);

        this.horizontalSplit = props.horizontalSplit;
        this.verticalSplit = props.verticalSplit;
    }

    render()
    {
        const {
            className,
            mode,
            horizontalSplit,
            verticalSplit
        } = this.props;

        const splitHorizontal = mode === EViewportLayoutMode.HorizontalSplit || mode === EViewportLayoutMode.Quad;
        const splitVertical = mode === EViewportLayoutMode.VerticalSplit || mode === EViewportLayoutMode.Quad;

        return (
            <div
                className={className} >

                {splitHorizontal ? <SplitterContainer
                    direction="horizontal"
                    onResize={this.onHorizontalResize}>

                    <SplitterSection
                        size={horizontalSplit}/>

                    <SplitterSection
                        size={1 - horizontalSplit}/>

                </SplitterContainer> : null}

                {splitVertical ? <SplitterContainer
                    direction="vertical"
                    onResize={this.onVerticalResize}>

                    <SplitterSection
                        size={verticalSplit}/>

                    <SplitterSection
                        size={1 - verticalSplit}/>

                </SplitterContainer> : null }

            </div>
        );
    }

    protected onHorizontalResize(event: ISplitterContainerResizeEvent)
    {
        this.horizontalSplit = event.sizes[0];
        this.emitChange(event.isDragging);
    }

    protected onVerticalResize(event: ISplitterContainerResizeEvent)
    {
        this.verticalSplit = event.sizes[0];
        this.emitChange(event.isDragging);
    }

    protected emitChange(isDragging: boolean)
    {
        const { id, index, mode, onChange } = this.props;
        if (onChange) {
            onChange({
                id,
                index,
                mode,
                horizontalSplit: this.horizontalSplit,
                verticalSplit: this.verticalSplit,
                isDragging,
                sender: this
            });
        }
    }
}