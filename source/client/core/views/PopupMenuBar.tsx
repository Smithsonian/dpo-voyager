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
import PopupButton from "@ff/react/PopupButton";

import ViewportMenu from "./ViewportMenu";
import RenderMenu from "./RenderMenu";

////////////////////////////////////////////////////////////////////////////////

/** Properties for [[PresentationMenuView]] component. */
export interface IPopupMenuBarProps
{
    className?: string;
    system: System;
    portal?: React.Component<any, any>;
}

export default class PopupMenuBar extends React.Component<IPopupMenuBarProps, {}>
{
    static readonly defaultProps = {
        className: "explorer-menu-view"
    };

    render()
    {
        const {
            className,
            system,
            portal
        } = this.props;

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
                        system={system} />
                </PopupButton>

                <PopupButton
                    portal={portal}
                    anchor="bottom"
                    modal={true}
                    icon="fas fa-palette"
                    title="Render Mode">
                    <RenderMenu
                        className="explorer-popup-menu render-menu"
                        system={system} />
                </PopupButton>

            </FlexContainer>
        );
    }


}