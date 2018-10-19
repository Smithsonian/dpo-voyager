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

import FlexContainer from "@ff/react/FlexContainer";
import FlexSpacer from "@ff/react/FlexSpacer";
import PopupButton from "@ff/react/PopupButton";

import { EViewPreset, EShaderType } from "common/types";

import ViewportMenu, { IViewportMenuSelectEvent } from "./ViewportMenu";
import RenderMenu, { IRenderMenuSelectEvent } from "./RenderMenu";

import OrbitManip, { EProjectionType } from "../components/OrbitManip";
import System from "@ff/core/ecs/System";

////////////////////////////////////////////////////////////////////////////////

/** Properties for [[PresentationMenuView]] component. */
export interface IExplorerMenuViewProps
{
    className?: string;
    system: System;
    portal?: React.Component<any, any>;
}

export interface IExplorerMenuViewState
{
    projectionType: EProjectionType;
    viewPreset: EViewPreset;
}

export default class ExplorerMenuView extends React.Component<IExplorerMenuViewProps, IExplorerMenuViewState>
{
    static readonly defaultProps = {
        className: "explorer-menu-view"
    };

    constructor(props: IExplorerMenuViewProps)
    {
        super(props);

        this.onSelectProjection = this.onSelectProjection.bind(this);
        this.onSelectViewPreset = this.onSelectViewPreset.bind(this);
        this.onSelectRenderMode = this.onSelectRenderMode.bind(this);

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
        const {
            className,
            system,
            portal
        } = this.props;

        const orbitManip = system.getComponent(OrbitManip);
        const projectionType = orbitManip.in("View.Projection").value;

        return (
            <FlexContainer
                className={className}
                direction="horizontal" >

                <PopupButton
                    portal={portal}
                    anchor="bottom"
                    modal={true}
                    icon="fas fa-eye"
                    title="View/Projection Settings">
                    <ViewportMenu
                        className="explorer-popup-menu viewport-menu"
                        viewportIndex={0}
                        projectionType={projectionType}
                        viewPreset={this.state.viewPreset}
                        onSelectProjection={this.onSelectProjection}
                        onSelectViewPreset={this.onSelectViewPreset} />
                </PopupButton>

                <PopupButton
                    portal={portal}
                    anchor="bottom"
                    modal={true}
                    icon="fas fa-palette"
                    title="Render Mode">
                    <RenderMenu
                        className="explorer-popup-menu render-menu"
                        renderMode={EShaderType.Wireframe}
                        onSelectRenderMode={this.onSelectRenderMode} />
                </PopupButton>

            </FlexContainer>
        );
    }

    protected onSelectProjection(event: IViewportMenuSelectEvent)
    {
        const orbitManip = this.props.system.getComponent(OrbitManip);
        orbitManip.in("View.Projection").setValue(event.index);
    }

    protected onSelectViewPreset(event: IViewportMenuSelectEvent)
    {
        const orbitManip = this.props.system.getComponent(OrbitManip);
        orbitManip.in("View.Preset").setValue(event.index);

        this.setState({ viewPreset: event.index });
    }

    protected onSelectRenderMode(event: IRenderMenuSelectEvent)
    {
        //this.props.actions.setShader(event.index);
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