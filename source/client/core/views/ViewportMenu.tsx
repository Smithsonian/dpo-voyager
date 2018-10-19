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

import System from "@ff/core/ecs/System";

import FlexContainer from "@ff/react/FlexContainer";
import GridContainer from "@ff/react/GridContainer";
import Label from "@ff/react/Label";
import Button, { IButtonTapEvent } from "@ff/react/Button";

import OrbitManip, { EViewPreset, EProjectionType } from "../components/OrbitManip";

////////////////////////////////////////////////////////////////////////////////

/** Properties for [[ViewportMenu]] component. */
export interface IViewportMenuProps
{
    className?: string;
    system: System;
}

export interface IViewportMenuState
{
    projectionType: EProjectionType;
    viewPreset: EViewPreset;
}

export default class ViewportMenu extends React.Component<IViewportMenuProps, IViewportMenuState>
{
    static readonly defaultProps = {
        className: "viewport-menu"
    };

    constructor(props: IViewportMenuProps)
    {
        super(props);

        this.onSelectProjection = this.onSelectProjection.bind(this);
        this.onSelectViewPreset = this.onSelectViewPreset.bind(this);

        this.state = {
            projectionType: EProjectionType.Perspective,
            viewPreset: EViewPreset.None
        };
    }

    componentDidMount()
    {
        const system = this.props.system;

        const orbitManip = system.getComponent(OrbitManip);
        orbitManip.out("Orbit.Manip").on("value", this.onManipChanged, this);
        orbitManip.out("View.Projection").on("value", this.onProjectionChanged, this);
    }

    componentWillUnmount()
    {
        const orbitManip = this.props.system.getComponent(OrbitManip);
        orbitManip.out("Orbit.Manip").off("value", this.onManipChanged, this);
        orbitManip.out("View.Projection").off("value", this.onProjectionChanged, this);
    }

    render()
    {
        const { projectionType, viewPreset } = this.state;

        return (
            <FlexContainer
                className={this.props.className}
                direction="vertical">

                <Label text="Projection"/>
                <FlexContainer
                    className="group projection"
                    direction="horizontal">

                    <Button
                        index={EProjectionType.Perspective}
                        text="Perspective"
                        icon="fas fa-video"
                        title="Perspective Projection"
                        selected={projectionType === EProjectionType.Perspective}
                        focused={projectionType === EProjectionType.Perspective}
                        onTap={this.onSelectProjection} />

                    <Button
                        index={EProjectionType.Orthographic}
                        text="Orthographic"
                        icon="fas fa-video"
                        title="Orthographic Projection"
                        selected={projectionType === EProjectionType.Orthographic}
                        focused={projectionType === EProjectionType.Orthographic}
                        onTap={this.onSelectProjection} />

                </FlexContainer>

                <Label text="View"/>
                <GridContainer
                    className="group view"
                    justifyContent="center" >

                    <Button
                        index={EViewPreset.Top}
                        className="control button cube"
                        text="T"
                        title="Top View"
                        selected={viewPreset === EViewPreset.Top}
                        style={{gridColumnStart: 2, gridRowStart: 1}}
                        onTap={this.onSelectViewPreset}/>

                    <Button
                        index={EViewPreset.Left}
                        className="control button cube"
                        text="L"
                        title="Left View"
                        selected={viewPreset === EViewPreset.Left}
                        style={{gridColumnStart: 1, gridRowStart: 2}}
                        onTap={this.onSelectViewPreset} />

                    <Button
                        index={EViewPreset.Front}
                        className="control button cube"
                        text="F"
                        title="Front View"
                        selected={viewPreset === EViewPreset.Front}
                        style={{gridColumnStart: 2, gridRowStart: 2}}
                        onTap={this.onSelectViewPreset} />

                    <Button
                        index={EViewPreset.Right}
                        className="control button cube"
                        text="R"
                        title="Right View"
                        selected={viewPreset === EViewPreset.Right}
                        style={{gridColumnStart: 3, gridRowStart: 2}}
                        onTap={this.onSelectViewPreset} />

                    <Button
                        index={EViewPreset.Back}
                        className="control button cube"
                        text="B"
                        title="Back View"
                        selected={viewPreset === EViewPreset.Back}
                        style={{gridColumnStart: 4, gridRowStart: 2}}
                        onTap={this.onSelectViewPreset} />

                    <Button
                        index={EViewPreset.Bottom}
                        className="control button cube"
                        text="B" title="Bottom View"
                        selected={viewPreset === EViewPreset.Bottom}
                        style={{gridColumnStart: 2, gridRowStart: 3}}
                        onTap={this.onSelectViewPreset} />

                </GridContainer>

            </FlexContainer>
        );
    };

    protected onSelectProjection(event: IButtonTapEvent)
    {
        const orbitManip = this.props.system.getComponent(OrbitManip);
        orbitManip.in("View.Projection").setValue(event.index as EProjectionType);
    }

    protected onSelectViewPreset(event: IButtonTapEvent)
    {
        const orbitManip = this.props.system.getComponent(OrbitManip);
        orbitManip.in("View.Preset").setValue(event.index as EViewPreset);

        this.setState({ viewPreset: event.index });
    }

    protected onManipChanged()
    {
        this.setState({ viewPreset: EViewPreset.None });
    }

    protected onProjectionChanged(projectionType: EProjectionType)
    {
        this.setState({ projectionType });
    }
}

