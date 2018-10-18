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

import OrbitManip from "../components/OrbitManip";
import System from "@ff/core/ecs/System";

import { EProjectionType } from "../components/Camera";
import PresentationController from "../components/PresentationController";

////////////////////////////////////////////////////////////////////////////////

/** Properties for [[PresentationMenuView]] component. */
export interface IPresentationMenuViewProps
{
    className?: string;
    system: System;
    portal?: React.Component<any, any>;
}

export interface IPresentationMenuViewState
{
    viewPreset: EViewPreset
}

export default class PresentationMenuView extends React.Component<IPresentationMenuViewProps, IPresentationMenuViewState>
{
    static readonly defaultProps = {
        className: "presentation-menu-view"
    };

    constructor(props: IPresentationMenuViewProps)
    {
        super(props);

        this.onSelectProjection = this.onSelectProjection.bind(this);
        this.onSelectViewPreset = this.onSelectViewPreset.bind(this);
        this.onSelectRenderMode = this.onSelectRenderMode.bind(this);

        this.state = {
            viewPreset: EViewPreset.None
        };
    }

    componentDidMount()
    {
        const system = this.props.system;

        const orbitManip = system.getComponent(OrbitManip);
        orbitManip.out("Orientation").on("value", this.onCameraOrientation, this);
    }

    componentWillUnmount()
    {
        const orbitManip = this.props.system.getComponent(OrbitManip);
        orbitManip.out("Orientation").off("value", this.onCameraOrientation, this);
    }

    render()
    {
        const {
            className,
            system,
            portal
        } = this.props;

        const orbitManip = system.getComponent(OrbitManip);
        const projectionType = orbitManip.in("Projection").value;

        return (
            <FlexContainer
                className={className}
                direction="horizontal" >

                <FlexSpacer/>

                <PopupButton
                    portal={portal}
                    anchor="bottom"
                    modal={true}
                    icon="fas fa-palette"
                    title="Render Mode">
                    <RenderMenu
                        className="popup-menu"
                        renderMode={EShaderType.Wireframe}
                        onSelectRenderMode={this.onSelectRenderMode} />
                </PopupButton>

                <PopupButton
                    portal={portal}
                    anchor="bottom"
                    modal={true}
                    icon="fas fa-eye"
                    title="View/Projection Settings">
                    <ViewportMenu
                        className="popup-menu"
                        viewportIndex={0}
                        projectionType={projectionType}
                        viewPreset={this.state.viewPreset}
                        onSelectProjection={this.onSelectProjection}
                        onSelectViewPreset={this.onSelectViewPreset} />
                </PopupButton>

            </FlexContainer>
        );
    }

    protected onSelectProjection(event: IViewportMenuSelectEvent)
    {
        const orbitManip = this.props.system.getComponent(OrbitManip);
        orbitManip.in("Projection").setValue(event.index);
    }

    protected onSelectViewPreset(event: IViewportMenuSelectEvent)
    {
        const orbitManip = this.props.system.getComponent(OrbitManip);
        orbitManip.in("Preset").setValue(event.index);

        this.setState({ viewPreset: event.index });
    }

    protected onSelectRenderMode(event: IRenderMenuSelectEvent)
    {
        //this.props.actions.setShader(event.index);
    }

    protected onCameraOrientation()
    {
        this.setState({ viewPreset: EViewPreset.None });
    }
}