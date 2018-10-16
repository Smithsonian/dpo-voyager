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

import ViewportMenu, { IViewportMenuSelectEvent } from "./ViewportMenu";
import RenderMenu, { IRenderMenuSelectEvent } from "./RenderMenu";

import {
    PresentationActions,
    ProjectionMode,
    ViewPreset,
    RenderMode
} from "../components/PresentationController";

////////////////////////////////////////////////////////////////////////////////

/** Properties for [[PresentationMenuView]] component. */
export interface IPresentationMenuViewProps
{
    className?: string;
    actions: PresentationActions;
    portal?: React.Component<any, any>;
}

export default class PresentationMenuView extends React.Component<IPresentationMenuViewProps, {}>
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
    }

    render()
    {
        const {
            className,
            portal
        } = this.props;

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
                        renderMode="wireframe"
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
                        index={0}
                        projection="perspective"
                        viewPreset="top"
                        onSelectProjection={this.onSelectProjection}
                        onSelectViewPreset={this.onSelectViewPreset} />
                </PopupButton>

            </FlexContainer>
        );
    }

    onSelectProjection(event: IViewportMenuSelectEvent)
    {
        this.props.actions.setProjection(event.index, event.id as ProjectionMode);
    }

    onSelectViewPreset(event: IViewportMenuSelectEvent)
    {
        this.props.actions.setViewPreset(event.index, event.id as ViewPreset);
    }

    onSelectRenderMode(event: IRenderMenuSelectEvent)
    {
        this.props.actions.setRenderMode(event.id as RenderMode);
    }
}