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
import SystemController from "../components/SystemController";

////////////////////////////////////////////////////////////////////////////////

/** Properties for [[ViewportMenu]] component. */
export interface IViewportMenuProps
{
    className?: string;
    system: System;
}

export default class ViewportMenu extends React.Component<IViewportMenuProps, {}>
{
    static readonly defaultProps = {
        className: "sv-viewport-menu"
    };

    protected controller: SystemController;

    constructor(props: IViewportMenuProps)
    {
        super(props);

        this.onSelectProjection = this.onSelectProjection.bind(this);
        this.onSelectViewPreset = this.onSelectViewPreset.bind(this);

        this.controller = props.system.getComponent(SystemController);
    }

    componentDidMount()
    {
        this.controller.addOutputListener(OrbitManip, "View.Projection", this.onProjectionChanged, this);
        this.controller.addOutputListener(OrbitManip, "View.Preset", this.onPresetChanged, this);
    }

    componentWillUnmount()
    {
        this.controller.removeOutputListener(OrbitManip, "View.Projection", this.onProjectionChanged, this);
        this.controller.removeOutputListener(OrbitManip, "View.Preset", this.onPresetChanged, this);
    }

    render()
    {
        const viewPreset = this.controller.getOutputValue(OrbitManip, "View.Preset");
        const projectionType = this.controller.getOutputValue(OrbitManip, "View.Projection");

        return (
            <FlexContainer
                className={this.props.className}
                direction="vertical">

                <Label text="Projection"/>
                <FlexContainer
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
                    className="sv-cube-group"
                    justifyContent="center" >

                    <Button
                        index={EViewPreset.Top}
                        className="ff-control ff-button sv-cube"
                        text="T"
                        title="Top View"
                        selected={viewPreset === EViewPreset.Top}
                        style={{gridColumnStart: 2, gridRowStart: 1}}
                        onTap={this.onSelectViewPreset}/>

                    <Button
                        index={EViewPreset.Left}
                        className="ff-control ff-button sv-cube"
                        text="L"
                        title="Left View"
                        selected={viewPreset === EViewPreset.Left}
                        style={{gridColumnStart: 1, gridRowStart: 2}}
                        onTap={this.onSelectViewPreset} />

                    <Button
                        index={EViewPreset.Front}
                        className="ff-control ff-button sv-cube"
                        text="F"
                        title="Front View"
                        selected={viewPreset === EViewPreset.Front}
                        style={{gridColumnStart: 2, gridRowStart: 2}}
                        onTap={this.onSelectViewPreset} />

                    <Button
                        index={EViewPreset.Right}
                        className="ff-control ff-button sv-cube"
                        text="R"
                        title="Right View"
                        selected={viewPreset === EViewPreset.Right}
                        style={{gridColumnStart: 3, gridRowStart: 2}}
                        onTap={this.onSelectViewPreset} />

                    <Button
                        index={EViewPreset.Back}
                        className="ff-control ff-button sv-cube"
                        text="B"
                        title="Back View"
                        selected={viewPreset === EViewPreset.Back}
                        style={{gridColumnStart: 4, gridRowStart: 2}}
                        onTap={this.onSelectViewPreset} />

                    <Button
                        index={EViewPreset.Bottom}
                        className="ff-control ff-button sv-cube"
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
        this.controller.actions.setInputValue(OrbitManip, "View.Projection", event.index);
    }

    protected onSelectViewPreset(event: IButtonTapEvent)
    {
        this.controller.actions.setInputValue(OrbitManip, "View.Preset", event.index);

        this.setState({ viewPreset: event.index });
    }

    protected onProjectionChanged()
    {
        this.forceUpdate();
    }

    protected onPresetChanged()
    {
        this.forceUpdate();
    }
}

